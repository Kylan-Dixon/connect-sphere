# ConnectSphere: Technical Specification

## 1. Overview

ConnectSphere is a specialized CRM (Customer Relationship Management) application designed to help professionals manage their network of connections efficiently. It provides tools for tracking interactions, setting reminders, and organizing contacts associated with different business entities. The application is built as a modern, installable Progressive Web App (PWA) for seamless use on both desktop and mobile devices.

### Core Goals:

- **Centralized Connection Management**: Provide a single source of truth for all professional contacts.
- **Actionable Reminders**: Enable users to set follow-up reminders to maintain relationships.
- **Efficient Bulk Operations**: Support bulk import and management of connections to save time.
- **Segregated Views**: Allow users to view connections based on their association with specific companies (e.g., "Mohan Financial," "Mohan Coaching").
- **Modern & Responsive UI**: Deliver a clean, intuitive, and performant user experience on any device.

---

## 2. Architecture & Tech Stack

ConnectSphere is a full-stack TypeScript application built on Next.js and Firebase. It leverages server-side rendering for performance and a client-heavy approach for rich interactivity.

### Tech Stack:

- **Framework**: **Next.js 15** (with App Router)
- **Language**: **TypeScript**
- **UI Library**: **React 18**
- **Component Library**: **ShadCN UI** (built on Radix UI and Tailwind CSS)
- **Styling**: **Tailwind CSS** with a themeable HSL color system in `globals.css`.
- **Backend & Database**: **Firebase**
  - **Authentication**: Firebase Authentication (Email/Password)
  - **Database**: Firestore (for storing connection data)
  - **Server-side Logic**: Firebase Admin SDK within Next.js Server Actions.
- **Forms**: **React Hook Form** with **Zod** for validation.
- **Data Tables**: **TanStack Table** for powerful, sortable, and filterable data grids.
- **PWA**: Implemented with a custom service worker (`sw.js`) and a `manifest.json` file.

---

## 3. Key Features and Implementation

### 3.1. Authentication

- **Implementation**: Uses Firebase Authentication on the client-side (`src/lib/firebase/client.ts`).
- **Flow**:
  1. Users sign up or log in via the `AuthForm` component (`src/components/auth/auth-form.tsx`).
  2. The `isUserAuthorized` server action (`src/lib/actions.ts`) checks new signups against a whitelist in the `authorized_users` Firestore collection.
  3. Session state is managed globally through `useAuth` and `AuthProvider` (`src/hooks/use-auth.tsx`).
  4. Protected routes (like the dashboard) are enforced by the `useRequireAuth` hook.

### 3.2. Connection Management (CRUD)

All CRUD (Create, Read, Update, Delete) operations are handled by **Next.js Server Actions** located in `src/lib/actions.ts`. This centralizes business logic on the server and provides a secure API for the client.

- **Create**: `addConnection` - Triggered from `AddConnectionForm`. Includes Zod validation.
- **Read**: Data is fetched client-side via `onSnapshot` listeners in each page component (e.g., `src/app/dashboard/page.tsx`), providing real-time updates.
- **Update**: `updateConnection` - Triggered from `EditConnectionSheet`. Includes Zod validation. Allows setting `stage` to `null`.
- **Delete**: `deleteConnection` - Triggered from `DeleteConnectionDialog`.

### 3.3. Data Tables & Filtering

- **Component**: `ConnectionsTable` (`src/components/connections/connections-table.tsx`) is the core component for displaying data.
- **State Preservation**: The table is configured with `autoResetPageIndex: false` to ensure the user stays on their current page after data reloads (e.g., after editing a connection).
- **Filtering**:
  - The `FilterSheet` component allows users to build complex filters.
  - Filter state is managed in the parent page and applied to the dataset via a `useMemo` hook, ensuring the UI only re-renders when necessary.
- **Columns**: Column definitions are in `columns.tsx` and `reminders-columns.tsx`. They define sorting behavior, cell rendering (e.g., `StageBadge`), and actions.

### 3.4. Bulk Operations

- **Bulk Upload**:
  - `BulkUpload` component (`src/components/connections/bulk-upload.tsx`) handles file parsing (using `xlsx`) and column mapping.
  - The `addBulkConnections` server action processes the mapped data and performs a batch write to Firestore.
- **Bulk Delete**:
  - `BulkAction` component (`src/components/connections/bulk-action.tsx`) provides a similar file upload and mapping interface.
  - `findBulkMatches` server action compares the uploaded file against existing Firestore data to find matches based on name, email, or phone.
  - The user reviews and confirms matches before the `bulkConnectionsAction` server action deletes the selected connections in a batch write.
- **Bulk Update**:
  - `BulkUpdateSheet` allows updating the `stage` or `reminderDate` for multiple selected connections simultaneously.
  - `bulkUpdateConnections` server action applies the changes in a single batch.

### 3.5. PWA (Progressive Web App)

- **Service Worker**: `public/sw.js` handles caching strategies. It now correctly ignores non-GET requests to prevent errors with Firestore's network calls.
- **Manifest**: `public/manifest.json` defines the app's metadata, icons, and display properties for installation.
- **Installation**: The `PwaInstallButton` component (`src/components/pwa-install-button.tsx`) provides a cross-platform installation prompt for both Android (via `beforeinstallprompt`) and iOS (via user instruction).

---

## 4. Project Structure

```
/src
├── app/                  # Next.js App Router: Pages and Layouts
│   ├── dashboard/        # Protected dashboard routes
│   └── (auth)/           # Route group for auth pages (login, signup)
├── components/           # React components
│   ├── auth/             # Authentication-related components
│   ├── connections/      # Components for managing connections (tables, forms)
│   ├── dashboard/        # Dashboard layout components (sidebar)
│   └── ui/               # Re-usable ShadCN UI components
├── hooks/                # Custom React hooks (e.g., use-auth, use-mobile)
├── lib/                  # Core logic, utilities, and server actions
│   ├── firebase/         # Firebase client and server initialization
│   ├── actions.ts        # Next.js Server Actions (main business logic)
│   └── types.ts          # TypeScript type definitions
└── public/               # Static assets (icons, manifest.json, sw.js)
```

---

## 5. Getting Started & Deployment

This project is managed and deployed via **Firebase Studio**. All dependencies listed in `package.json` are automatically installed during the build process.

- **Local Development**: Run the app locally using the `dev` script in `package.json`.
- **Deployment**: Deployments are handled automatically by Firebase App Hosting when changes are pushed to the connected Git repository. The build process uses Cloud Buildpacks to create a production-optimized container image.
