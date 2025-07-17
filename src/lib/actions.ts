
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
  log('--- Inside addConnection server action ---');
  try {
    const { db } = await getFirebaseAdmin();
    log(`Value received for "db" from getFirebaseAdmin(): ${JSON.stringify(db)}`);
    log(`Type of "db": ${typeof db}`);
    if (db) {
      log(`Keys of "db" object: ${Object.keys(db)}`);
    }

    if (!db) {
        throw new Error('Database not initialized correctly. The "db" object is falsy.');
    }

    const validatedFields = connectionSchema.safeParse(data);

    if (!validatedFields.success) {
      const errorDetails = validatedFields.error.flatten().fieldErrors;
      log(`Validation failed: ${JSON.stringify(errorDetails)}`);
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
    
    // If 'Referral' is not in tags, don't save referrerName
    if (!connectionData.tags?.includes('Referral')) {
        delete (connectionData as Partial<typeof connectionData>).referrerName;
    }


    log('Attempting to access "connections" collection using Admin SDK...');
    const connectionsCollectionRef = db.collection('connections');
    await connectionsCollectionRef.add(connectionData);
    log('Successfully added document to "connections" collection.');
    
    if (validatedFields.data.associatedCompany === 'Mohan Coaching') {
      try {
        log('Triggering Zapier webhook for Mohan Coaching...');
        await fetch('https://hooks.zapier.com/hooks/catch/123456/abcdef', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(connectionData),
        });
        log('Zapier webhook triggered.');
      } catch (error) {
          log(`Failed to trigger Zapier webhook: ${error}`);
          // Non-blocking error
      }
    }
    
    revalidatePath('/dashboard');
    return { success: true, message: 'Connection added successfully.' };
  } catch (error: any) {
     log(`Error in addConnection: ${error.message}`);
     log(`Stack trace: ${error.stack}`);
     log('--- End of addConnection server action with error ---');
     return { success: false, message: `Failed to add connection: ${error.message}` };
  }
}
