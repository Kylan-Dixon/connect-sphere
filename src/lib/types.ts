import { type Timestamp } from 'firebase/firestore';

export type Connection = {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  linkedInUrl?: string;
  company?: string;
  title?: string;
  associatedCompany: 'Mohan Financial' | 'Mohan Coaching';
  tags?: ('Connection' | 'Referral')[];
  referrerName?: string;
  reminderDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  userId?: string; // Changed to optional
  stage?: 1 | 2 | 3 | 4;
};
