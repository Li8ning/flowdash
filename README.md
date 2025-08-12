# FlowDash - Inventory Management System

FlowDash is a web-based application designed for small to medium-sized factories to manage their product inventory and track production. It provides a user-friendly interface for floor staff to log their work and for factory admins to oversee operations, manage products, and view reports.

## Comprehensive Documentation

For a detailed technical overview of the project, including architecture, API endpoints, database schema, and component descriptions, please refer to the main documentation file:

**[➡️ View Full Documentation](./DOCUMENTATION.md)**

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v14+ with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [Vercel Postgres](https://vercel.com/storage/postgres)
*   **UI Library:** [Chakra UI](https://chakra-ui.com/)
*   **Authentication:** [JWT](https://jwt.io/)
*   **File Storage:** [Vercel Blob](https://vercel.com/storage/blob)
*   **Testing:** [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)
*   **CI/CD:** [GitHub Actions](https://github.com/features/actions)

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later)
*   [npm](https://www.npmjs.com/)
*   A Vercel Postgres database

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repository-url>
    cd flowdash
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variables. See `DOCUMENTATION.md` for more details.

```
# Vercel Postgres connection string
POSTGRES_URL="your_postgres_connection_string"

# Secret for signing JWTs (must be at least 32 characters long)
JWT_SECRET="your_super_secret_and_long_jwt_secret"

# Vercel Blob read/write token
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"

# Sentry DSN for error reporting (optional)
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"
```

## Running the Application

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Running Tests

To run the test suite, use the following command:

```bash
npm test
