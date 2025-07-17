# **App Name**: ConnectSphere MVP

## Core Features:

- User Authentication: User authentication using Firebase Authentication (email/password).
- Add Connection Form: Form to manually enter connection details: Name, LinkedIn Profile URL, Company, Title, Connection's Company, Associated Company (dropdown with choice: Mohan Financial, or Mohan Coaching), Tags, Reminder Date, and Notes.
- Data Storage: Save form data to Firestore in a `connections` collection, including a `createdAt` timestamp.
- Data Display: Dashboard to display connections data using AG Grid, filtered by Mohan Coaching and Mohan Financial. Implement tabs on the left for selecting the associated company: Mohan Coaching tab on the left side, and a Mohan Financial tab below it, and a final tab for reminders.
- GoHighLevel Zap: Cloud Function triggered on new connection creation to send data to a Zapier webhook for Mohan Coaching.
- Reminder Email: Scheduled Cloud Function to send reminder emails for connections with `reminderDate` equal to the current date.

## Style Guidelines:

- Primary color: White for a clean and modern look, with text and icons in black.
- Background color: White
- Accent color: Very subtle accent color (e.g., a muted gray or a desaturated blue) for interactive elements, to provide visual interest without overwhelming the eye.  Text and icons in black.
- Font pairing: 'Space Grotesk' (sans-serif) for headings, matched with 'Inter' (sans-serif) for body text. Text in black.
- Minimalist, professional icons from Material-UI (MUI) to represent connection details and actions. Icons in black.
- Clean, structured layout with clear separation of form elements and data tables, with tabs on the left side, similar to the provided image.
- Subtle animations and transitions for form input validation and data loading. Elements in black.