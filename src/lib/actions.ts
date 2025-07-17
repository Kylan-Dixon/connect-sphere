"use server";

import { z } from "zod";
import { auth, db } from "@/lib/firebase/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// --- AUTH ACTIONS ---

export async function signUpWithEmail(prevState: any, formData: FormData) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const validatedFields = schema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid fields. " + validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    await auth.createUser({
      email,
      password,
    });
    return { success: true, message: "User created successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// NOTE: Firebase Admin SDK doesn't handle sign-in. This is a placeholder.
// Actual sign-in is handled client-side with the Firebase JS SDK.
// This action is here to demonstrate form handling with server actions.
export async function signInWithEmail(prevState: any, formData: FormData) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"), // min 1 for presence check
  });
  
  const validatedFields = schema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  // Client-side will handle the actual sign-in.
  return { success: true, message: "Proceeding to sign in." };
}

// --- CONNECTION ACTIONS ---

const connectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  linkedInUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  associatedCompany: z.enum(["Mohan Financial", "Mohan Coaching"]),
  tags: z.string().optional(),
  reminderDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  userId: z.string(),
});

export async function addConnection(data: unknown) {
  const validatedFields = connectionSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const connectionData = {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "connections"), connectionData);
    
    // Placeholder for GoHighLevel Zap
    if (validatedFields.data.associatedCompany === 'Mohan Coaching') {
      try {
        // In a real app, use an environment variable for the webhook URL
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
    
    revalidatePath("/dashboard");
    return { success: true, message: "Connection added successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
