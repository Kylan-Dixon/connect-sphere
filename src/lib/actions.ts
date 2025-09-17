
'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';


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
      return { success: false, message: 'Invalid data', errors: validatedFields.error.flatten().fieldErrors };
    }
    const { ...connectionData } = validatedFields.data;
    const dataToSubmit: { [key: string]: any } = { ...connectionData, createdAt: Timestamp.now() };
    if (!dataToSubmit.tags?.includes('Referral')) {
      delete dataToSubmit.referrerName;
    }
    await db.collection('connections').add(dataToSubmit);
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
            return { success: false, message: "Invalid data provided.", errors: validatedFields.error.flatten().fieldErrors };
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

// --- BULK UPLOADS ---

const bulkUploadMappedField = z.enum([
    'name', 'email', 'phoneNumber', 'linkedInUrl', 'company', 'title', 'notes', 'ignore', 'firstName', 'lastName'
]);
type BulkUploadMappedField = z.infer<typeof bulkUploadMappedField>;

const bulkUploadSchema = z.object({
  associatedCompany: z.enum(['Mohan Financial', 'Mohan Coaching']),
  jsonData: z.array(z.record(z.any())),
  mapping: z.record(bulkUploadMappedField),
});

export async function addBulkConnections(data: unknown) {
  try {
    const { db } = await getFirebaseAdmin();
    const validatedRequest = bulkUploadSchema.safeParse(data);

    if (!validatedRequest.success) {
      return { success: false, message: 'Invalid data format for bulk upload.' };
    }
    
    const { associatedCompany, jsonData, mapping } = validatedRequest.data;
    const batch = db.batch();
    let count = 0;

    const reverseMapping: { [key in BulkUploadMappedField]?: string } = {};
    for (const header in mapping) {
        const field = mapping[header];
        if (field !== 'ignore') {
            if (!reverseMapping[field]) reverseMapping[field] = header;
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

        if (!name) continue;

        const connectionData: any = {
            associatedCompany,
            createdAt: Timestamp.now(),
            tags: ['Connection'],
            name: name
        };
        
        for (const field in reverseMapping) {
            const headerKey = field as BulkUploadMappedField;
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
        return { success: false, message: 'No valid connections found to upload.' };
    }

    await batch.commit();
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/connections/${associatedCompany.toLowerCase().replace(' ', '-')}`);
    
    return { success: true, message: `${count} connections added successfully.` };
  } catch (error: any) {
    return { success: false, message: `Failed to add bulk connections: ${error.message}` };
  }
}

// --- BULK UPDATES ---

const bulkUpdateRemindersSchema = z.object({
  connectionIds: z.array(z.string().min(1)),
  reminderDate: z.coerce.date(),
});

export async function bulkUpdateReminders(data: unknown) {
  try {
    const { db } = await getFirebaseAdmin();
    const validatedRequest = bulkUpdateRemindersSchema.safeParse(data);

    if (!validatedRequest.success) {
      return { success: false, message: 'Invalid data for bulk update.' };
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
    return { success: false, message: `Failed to bulk update reminders: ${error.message}` };
  }
}


// --- BULK CONNECTION ACTIONS ---

const bulkActionMappedField = z.enum([
    'name', 'firstName', 'lastName', 'preferredName', 'email', 'personalEmail', 'homePhone', 'mobilePhone', 'ignore'
]);
type BulkActionMappedField = z.infer<typeof bulkActionMappedField>;

const findMatchesSchema = z.object({
  associatedCompany: z.enum(['Mohan Financial', 'Mohan Coaching']).optional(),
  jsonData: z.array(z.record(z.any())),
  mapping: z.record(bulkActionMappedField),
});

const normalizePhone = (phone: string) => phone.replace(/[^\d]/g, '');

export async function findBulkMatches(data: unknown) {
    try {
        const { db } = await getFirebaseAdmin();
        const validatedRequest = findMatchesSchema.safeParse(data);

        if (!validatedRequest.success) {
            return { success: false, message: 'Invalid data format for finding matches.' };
        }

        const { associatedCompany, jsonData, mapping } = validatedRequest.data;

        const reverseMapping: { [key in BulkActionMappedField]?: string } = {};
        for (const header in mapping) {
            const field = mapping[header];
            if (field !== 'ignore') {
                 if (!reverseMapping[field]) reverseMapping[field] = header;
            }
        }

        const fileIdentifiers = jsonData.map(row => {
            const name = (row[reverseMapping.name!] || '').trim().toLowerCase();
            const firstName = (row[reverseMapping.firstName!] || '').trim().toLowerCase();
            const lastName = (row[reverseMapping.lastName!] || '').trim().toLowerCase();
            const preferredName = (row[reverseMapping.preferredName!] || '').trim().toLowerCase();
            const email = (row[reverseMapping.email!] || '').trim().toLowerCase();
            const personalEmail = (row[reverseMapping.personalEmail!] || '').trim().toLowerCase();
            const homePhone = (row[reverseMapping.homePhone!] || '');
            const mobilePhone = (row[reverseMapping.mobilePhone!] || '');

            let fullName = name;
            if (!fullName && (firstName || lastName)) {
                fullName = `${firstName} ${lastName}`.trim();
            }

            return {
                name: fullName,
                preferredName,
                allNames: [fullName, preferredName, firstName].filter(Boolean),
                emails: [email, personalEmail].filter(Boolean).map(e => e.toLowerCase()),
                phones: [homePhone, mobilePhone].filter(Boolean).map(normalizePhone),
                fileRow: row
            };
        }).filter(id => id.allNames.length > 0 || id.emails.length > 0 || id.phones.length > 0);

        if (fileIdentifiers.length === 0) {
            return { success: true, matches: [] };
        }
        
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('connections');
        if (associatedCompany) {
            query = query.where('associatedCompany', '==', associatedCompany);
        }
        const connectionsSnapshot = await query.get();

        if (connectionsSnapshot.empty) {
            return { success: true, matches: [] };
        }

        const allConnections = connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const potentialMatches: any[] = [];

        for (const identifier of fileIdentifiers) {
            for (const connection of allConnections) {
                const matchReasons: string[] = [];
                const connName = (connection.name || '').toLowerCase();
                const connEmail = (connection.email || '').toLowerCase();
                const connPhone = connection.phoneNumber ? normalizePhone(connection.phoneNumber) : null;
                
                if (identifier.allNames.some(name => connName.includes(name) && name !== '')) {
                    matchReasons.push('Name Match');
                }
                if (identifier.emails.some(email => connEmail === email && email !== '')) {
                    matchReasons.push('Email Match');
                }
                if (connPhone && identifier.phones.some(phone => connPhone.includes(phone) && phone !== '')) {
                    matchReasons.push('Phone Match');
                }

                if (matchReasons.length > 0) {
                    potentialMatches.push({
                        reasons: [...new Set(matchReasons)],
                        fileRow: identifier.fileRow,
                        connection: {
                            id: connection.id,
                            name: connection.name,
                            email: connection.email,
                            phoneNumber: connection.phoneNumber,
                            company: connection.company
                        }
                    });
                    break; 
                }
            }
        }

        return { success: true, matches: potentialMatches };

    } catch (error: any) {
        console.error("Error in findBulkMatches:", error);
        return { success: false, message: `Failed to find matches: ${error.message}` };
    }
}

const bulkActionSchema = z.object({
  connectionIds: z.array(z.string().min(1)),
  action: z.enum(['delete']), 
});

export async function bulkConnectionsAction(data: unknown) {
    try {
        const { db } = await getFirebaseAdmin();
        const validatedRequest = bulkActionSchema.safeParse(data);

        if (!validatedRequest.success) {
            return { success: false, message: 'Invalid data for bulk action.' };
        }

        const { connectionIds, action } = validatedRequest.data;
        const batch = db.batch();
        let actionCount = 0;

        if (action === 'delete') {
            connectionIds.forEach(id => {
                const docRef = db.collection('connections').doc(id);
                batch.delete(docRef);
                actionCount++;
            });
        }
        
        if (actionCount === 0) {
            return { success: false, message: 'No connections were selected for the action.' };
        }

        await batch.commit();

        revalidatePath('/dashboard', 'layout');
        
        return { success: true, message: `${actionCount} connections have been successfully ${action}d.` };

    } catch (error: any) {
        console.error(`Error in bulkConnectionsAction (${action}):`, error);
        return { success: false, message: `Failed to perform bulk action: ${error.message}` };
    }
}
