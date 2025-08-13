# Inventory Management System

This is a web-based inventory management system designed to track product stock, manage production logs, and handle user access control. The application is built with a modern tech stack, including Next.js, TypeScript, and a PostgreSQL database.

## Key Features

*   **Role-Based Access Control (RBAC):** The system supports three user roles (`super_admin`, `admin`, `floor_staff`) with granular permissions.
*   **Product Management:** Create, update, and manage products, including attributes like color, design, and quality.
*   **Inventory Logging:** Track inventory changes with detailed logs, including who made the change and when.
*   **User Management:** Invite, deactivate, and manage user accounts.
*   **Data Export:** Export inventory logs to PDF and Excel formats.
*   **Dashboard Analytics:** (Future) Visualize key inventory metrics and production trends.

## Tech Stack

*   **Frontend:** Next.js, React, TypeScript, Chakra UI
*   **Backend:** Next.js API Routes, PostgreSQL (Vercel Postgres)
*   **Authentication:** JWT (RS256)
*   **Database ORM:** `node-postgres` (pg)
*   **Validation:** Zod

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   ├── (dashboard)/        # Main application pages (protected)
│   │   └── (auth)/             # Authentication pages (login, register)
│   ├── components/             # Reusable React components
│   ├── context/                # React context providers (e.g., AuthContext)
│   ├── hooks/                  # Custom React hooks (e.g., useCrud)
│   ├── lib/                    # Core libraries (API client, auth, db, etc.)
│   └── types/                  # Centralized TypeScript types
├── .env.local                  # Environment variables
├── .github/workflows/ci.yml    # CI/CD pipeline
└── README.md                   # This file
```

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn
*   A PostgreSQL database

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following variables:

    ```
    POSTGRES_URL="your_database_connection_string"
    JWT_PRIVATE_KEY="your_private_key"
    JWT_PUBLIC_KEY="your_public_key"
    ```

    *   `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` should be a valid RS256 key pair.

4.  **Run the database migrations:**
    (Instructions for running migrations would go here. Since we don't have a migration tool set up, this is a placeholder.)

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that performs the following checks on every push and pull request to the `main` branch:

*   **Linting:** Runs `npm run lint` to enforce code style.
*   **Security Scanning:** Uses Trivy to scan for vulnerabilities in the codebase.

This concludes the project audit and improvement tasks. The application is now more secure, performant, and maintainable.
