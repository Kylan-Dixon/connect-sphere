
'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
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
    
    const { ...connectionData } = validatedFields.data;

    const dataToSubmit: { [key: string]: any } = {
      ...connectionData,
      createdAt: Timestamp.now(),
    };

    if (!dataToSubmit.tags?.includes('Referral')) {
      delete dataToSubmit.referrerName;
    }

    const newConnectionRef = await db.collection('connections').add(dataToSubmit);
    
    // --- ZAPIER / GOHIGHLEVEL INTEGRATION ---
    if (dataToSubmit.associatedCompany === 'Mohan Coaching') {
      const webhookUrl = process.env.ZAPIER_MOHAN_COACHING_WEBHOOK_URL;
      if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: newConnectionRef.id,
                ...dataToSubmit,
                createdAt: dataToSubmit.createdAt.toDate().toISOString(), 
                reminderDate: dataToSubmit.reminderDate ? dataToSubmit.reminderDate.toISOString() : null,
              }),
            });
          } catch (webhookError: any) {
            console.error('Failed to send webhook:', webhookError.message);
          }
      }
    }

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
        const updateData: { [key: string]: any } = { ...connectionData };


        if (!updateData.tags?.includes('Referral')) {
            updateData.referrerName = FieldValue.delete();
        }
        
        updateData.updatedAt = Timestamp.now();

        if (updateData.reminderDate && updateData.reminderDate instanceof Date) {
            updateData.reminderDate = Timestamp.fromDate(updateData.reminderDate);
        } else if (updateData.reminderDate === undefined || updateData.reminderDate === null) {
            updateData.reminderDate = null;
        }


        await db.collection('connections').doc(id).update(updateData);

        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/connections/${connectionData.associatedCompany.toLowerCase().replace(/\s/g, '-')}`);
        revalidatePath('/dashboard/reminders');

        return { success: true, message: 'Connection updated successfully.' };
    } catch (error: any) {
        console.error("Update Connection Error:", error);
        return { success: false, message: `Failed to update connection: ${error.message}` };
    }
}

export async function deleteConnection(id: string) {
  try {
    const { db } = await getFirebaseAdmin();
    await db.collection('connections').doc(id).delete();
    
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/connections/mohan-financial');
    revalidatePath('/dashboard/connections/mohan-coaching');
    revalidatePath('/dashboard/reminders');
    
    return { success: true, message: 'Connection deleted successfully.' };
  } catch (error: any) {
    console.error("Delete Connection Error:", error);
    return { success: false, message: `Failed to delete connection: ${error.message}` };
  }
}


const mappedField = z.enum([
    'name', 'email', 'phoneNumber', 'linkedInUrl', 'company', 'title', 'notes', 'ignore', 'firstName', 'lastName'
]);
type MappedField = z.infer<typeof mappedField>;

const bulkUploadSchema = z.object({
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
    
    const { associatedCompany, jsonData, mapping } = validatedRequest.data;

    const batch = db.batch();
    let count = 0;

    const reverseMapping: { [key in MappedField]?: string } = {};
    for (const header in mapping) {
        const field = mapping[header];
        if (field !== 'ignore') {
            if (!reverseMapping[field]) {
                 reverseMapping[field] = header;
            }
        }
    }


    for (const row of jsonData) {
        const nameHeader = reverseMapping['name'];
        const firstNameHeader = reverseMapping['firstName'];
        const lastNameHeader = reverseMapping['lastName'];

        let name = '';
        if (nameHeader && row[nameHeader]) {
          name = row[nameHeader];
        } else if (firstNameHeader && lastNameHeader) {
          name = `${row[firstNameHeader] || ''} ${row[lastNameHeader] || ''}`.trim();
        } else if (firstNameHeader && row[firstNameHeader]) {
          name = row[firstNameHeader].trim();
        }

        if (!name) {
            continue; // Skip rows without a name
        }

        const connectionData: any = {
            associatedCompany,
            createdAt: Timestamp.now(),
            tags: ['Connection'],
            name: name
        };
        
        for (const field in reverseMapping) {
            const headerKey = field as MappedField;
            if (['name', 'firstName', 'lastName'].includes(headerKey)) continue; 

            const header = reverseMapping[headerKey];
            if (header && row[header]) {
                 connectionData[headerKey] = row[header];
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

const bulkUpdateRemindersSchema = z.object({
  connectionIds: z.array(z.string().min(1)),
  reminderDate: z.coerce.date(),
});

export async function bulkUpdateReminders(data: unknown) {
  try {
    const { db } = await getFirebaseAdmin();
    const validatedRequest = bulkUpdateRemindersSchema.safeParse(data);

    if (!validatedRequest.success) {
      return {
        success: false,
        message: 'Invalid data for bulk update.',
        errors: validatedRequest.error.flatten().fieldErrors,
      };
    }
    
    const { connectionIds, reminderDate } = validatedRequest.data;
    const reminderTimestamp = Timestamp.fromDate(reminderDate);

    const batch = db.batch();

    connectionIds.forEach(id => {
      const docRef = db.collection('connections').doc(id);
      batch.update(docRef, { reminderDate: reminderTimestamp });
    });

    await batch.commit();

    revalidatePath('/dashboard', 'layout');

    return { success: true, message: `Successfully updated reminders for ${connectionIds.length} connections.` };
  } catch (error: any) {
    console.error("Error in bulkUpdateReminders:", error);
    return { success: false, message: `Failed to bulk update reminders: ${error.message}` };
  }
}
