'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

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
  tags: z.string().optional(),
  reminderDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  userId: z.string(),
});

export async function addConnection(data: unknown) {
  try {
    const { db } = await getFirebaseAdmin();

    const validatedFields = connectionSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Invalid data',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const connectionData = {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'connections'), connectionData);
    
    if (validatedFields.data.associatedCompany === 'Mohan Coaching') {
      try {
        await fetch('https://hooks.zapier.com/hooks/catch/123456/abcdef', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(connectionData),
        });
      } catch (error) {
          console.error('Failed to trigger Zapier webhook:', error);
          // Non-blocking error
      }
    }
    
    revalidatePath('/dashboard');
    return { success: true, message: 'Connection added successfully.' };
  } catch (error: any) {
     return { success: false, message: `Failed to add connection: ${error.message}` };
  }
}
