
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

    const newConnectionRef = await db.collection('connections').add(connectionData);
    
    // --- ZAPIER / GOHIGHLEVEL INTEGRATION ---
    
    // Option 1: Firestore Query (Free Zapier Tier)
    // Use the following JSON query in Zapier's "New Document in Collection" trigger
    // to find new connections for Mohan Coaching.
    /*
    {
      "where": {
        "fieldFilter": {
          "field": {
            "fieldPath": "associatedCompany"
          },
          "op": "EQUAL",
          "value": {
            "stringValue": "Mohan Coaching"
          }
        }
      },
      "orderBy": [
        {
          "field": {
            "fieldPath": "createdAt"
          },
          "direction": "DESCENDING"
        }
      ]
    }
    */

    // Option 2: Webhook (Paid Zapier Tier)
    // This is currently commented out. To use it, uncomment the code below
    // and replace the placeholder URL with your actual Zapier Webhook URL.
    /*
    if (connectionData.associatedCompany === 'Mohan Coaching') {
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID_HERE/';
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newConnectionRef.id,
            ...connectionData,
            // Convert timestamp to a Zapier-friendly format
            createdAt: connectionData.createdAt.toDate().toISOString(), 
            reminderDate: connectionData.reminderDate ? connectionData.reminderDate.toISOString() : null,
          }),
        });
      } catch (webhookError: any) {
        // Log the error but don't block the main operation
        console.error('Failed to send webhook:', webhookError.message);
      }
    }
    */

    revalidatePath('/dashboard');
    return { success: true, message: 'Connection added successfully.' };
  } catch (error: any) {
     return { success: false, message: `Failed to add connection: ${error.message}` };
  }
}
