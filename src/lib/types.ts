import { type Timestamp } from 'firebase/firestore';

export type Connection = {
  id: string;
  name: string;
  linkedInUrl?: string;
  company?: string;
  title?: string;
  associatedCompany: 'Mohan Financial' | 'Mohan Coaching';
  tags?: string;
  reminderDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  userId: string;
};
