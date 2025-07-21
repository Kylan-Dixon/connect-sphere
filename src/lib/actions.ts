
'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'firebase-admin.log');

function log(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `${timestamp}: ${message}\n`, 'utf8');
}


// --- AUTH ACTIONS ---
// Note: Sign-up and sign-in are primarily handled client-side for this app.
// These server actions are here as examples but are not actively used by the auth form.

export async function signUpWithEmail(prevState: any, formData: FormData) {
  try {
    const { auth } = await getFirebaseAdmin();
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const validatedFields = schema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Invalid fields. ' + validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validatedFields.data;

    await auth.createUser({
      email,
      password,
    });
    return { success: true, message: 'User created successfully.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- CONNECTION ACTIONS ---

const connectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  linkedInUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  associatedCompany: z.enum(['Mohan Financial', 'Mohan Coaching']),
  tags: z.array(z.enum(['Connection', 'Referral'])).optional(),
  referrerName: z.string().optional(),
  reminderDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  userId: z.string(),
});

export async function addConnection(data: unknown) {
  try {
    const { db } = await getFirebaseAdmin();

    const validatedFields = connectionSchema.safeParse(data);

    if (!validatedFields.success) {
      const errorDetails = validatedFields.error.flatten().fieldErrors;
      return {
        success: false,
        message: 'Invalid data',
        errors: errorDetails,
      };
    }

    const connectionData = {
      ...validatedFields.data,
      createdAt: Timestamp.now(),
    };
    
    if (!connectionData.tags?.includes('Referral')) {
        delete (connectionData as Partial<typeof connectionData>).referrerName;
    }

    await db.collection('connections').add(connectionData);
    
    revalidatePath('/dashboard');
    return { success: true, message: 'Connection added successfully.' };
  } catch (error: any) {
     return { success: false, message: `Failed to add connection: ${error.message}` };
  }
}
