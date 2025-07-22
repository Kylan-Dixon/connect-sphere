
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

export async function isUserAuthorized(email: string) {
    try {
        const { db } = await getFirebaseAdmin();
        const authorizedUserRef = db.collection('authorized_users').doc(email);
        const doc = await authorizedUserRef.get();

        if (doc.exists) {
            return { success: true, message: 'User is authorized.' };
        } else {
            return { success: false, message: 'This email is not authorized. Please contact an administrator to be added to the whitelist.' };
        }
    } catch (error: any) {
        return { success: false, message: 'An error occurred during authorization check.' };
    }
}

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
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  linkedInUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  associatedCompany: z.enum(['Mohan Financial', 'Mohan Coaching']),
  tags: z.array(z.enum(['Connection', 'Referral'])).optional(),
  referrerName: z.string().optional(),
  reminderDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

const addConnectionSchema = connectionSchema.extend({
    userId: z.string(),
});

export async function addConnection(data: unknown) {
  try {
    const { db } = await getFirebaseAdmin();

    const validatedFields = addConnectionSchema.safeParse(data);

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
    // to find new connections for Mohan Coaching. This is the recommended approach for the free tier.
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

export async function updateConnection(id: string, data: unknown) {
    try {
        const { db } = await getFirebaseAdmin();

        const validatedFields = connectionSchema.safeParse(data);
        if (!validatedFields.success) {
            return {
                success: false,
                message: "Invalid data provided.",
                errors: validatedFields.error.flatten().fieldErrors
            };
        }
        
        const connectionData = validatedFields.data;

        if (!connectionData.tags?.includes('Referral')) {
            (connectionData as Partial<typeof connectionData>).referrerName = undefined;
        }

        await db.collection('connections').doc(id).update({
            ...connectionData,
             // Firestore expects its own Timestamp object for dates
            reminderDate: connectionData.reminderDate ? Timestamp.fromDate(connectionData.reminderDate) : null,
            updatedAt: Timestamp.now(),
        });

        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/connections/${connectionData.associatedCompany.toLowerCase().replace(/\s/g, '-')}`);
        revalidatePath('/dashboard/reminders');

        return { success: true, message: 'Connection updated successfully.' };
    } catch (error: any) {
        return { success: false, message: `Failed to update connection: ${error.message}` };
    }
}


const mappedField = z.enum([
    'name', 'email', 'phoneNumber', 'linkedInUrl', 'company', 'title', 'notes', 'ignore'
]);
type MappedField = z.infer<typeof mappedField>;

const bulkUploadSchema = z.object({
  userId: z.string(),
  associatedCompany: z.enum(['Mohan Financial', 'Mohan Coaching']),
  jsonData: z.array(z.record(z.any())),
  mapping: z.record(mappedField),
});

export async function addBulkConnections(data: unknown) {
  try {
    const { db } = await getFirebaseAdmin();
    const validatedRequest = bulkUploadSchema.safeParse(data);

    if (!validatedRequest.success) {
      console.error("Bulk upload validation error:", JSON.stringify(validatedRequest.error.flatten(), null, 2));
      return {
        success: false,
        message: 'Invalid data format. Please check your file and column names.',
      };
    }
    
    const { userId, associatedCompany, jsonData, mapping } = validatedRequest.data;

    const batch = db.batch();
    let count = 0;

    const reverseMapping: { [key in MappedField]?: string } = {};
    for (const key in mapping) {
        if(mapping[key] !== 'ignore') {
            reverseMapping[mapping[key]] = key;
        }
    }

    for (const row of jsonData) {
        const nameHeader = reverseMapping['name'];
        if (!nameHeader || !row[nameHeader]) {
            continue; // Skip rows without a name
        }

        const connectionData: any = {
            userId,
            associatedCompany,
            createdAt: Timestamp.now(),
            tags: ['Connection'],
        };

        for (const field of mappedField.options) {
            if (field === 'ignore' || !reverseMapping[field]) continue;
            
            const header = reverseMapping[field];
            if(header && row[header]) {
                 connectionData[field] = row[header];
            }
        }
        
      const newConnectionRef = db.collection('connections').doc();
      batch.set(newConnectionRef, connectionData);
      count++;
    }

    if (count === 0) {
        return { success: false, message: 'No valid connections with a name could be processed based on your mapping.' };
    }

    await batch.commit();
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/connections/${associatedCompany.toLowerCase().replace(' ', '-')}`);
    
    return { success: true, message: `${count} connections added successfully.` };
  } catch (error: any) {
    console.error("Error in addBulkConnections:", error);
    return { success: false, message: `Failed to add bulk connections: ${error.message}` };
  }
}
