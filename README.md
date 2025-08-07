# FlowDash - Inventory Management System

FlowDash is a web-based application designed for small to medium-sized factories to manage their product inventory and track production. It provides a user-friendly interface for floor staff to log their work and for factory admins to oversee operations, manage products, and view reports.

## Features

*   **User Authentication:** Secure registration and login for factory admins and floor staff.
*   **Role-Based Access Control:** Different permissions for admins (full access) and staff (limited to their own logs).
*   **Product Management:** Admins can create, view, and update product information.
*   **Inventory Logging:** Floor staff can log the quantity of products they have produced.
*   **Dashboard & Reporting:** Admins can view production summaries and generate reports.
*   **Multi-language Support:** The user interface can be switched between English, Hindi, and Gujarati.
*   **Error Monitoring:** Integrated with Sentry for real-time error tracking.
*   **Structured Logging:** Uses Pino for structured, detailed application logs.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v14+ with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [Vercel Postgres](https://vercel.com/storage/postgres) (Serverless)
*   **UI Library:** [Chakra UI](https://chakra-ui.com/)
*   **Authentication:** [JWT](https://jwt.io/) with the `jose` library
*   **Validation:** [Zod](https://zod.dev/) for input validation
*   **Testing:** [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
*   **CI/CD:** [GitHub Actions](https://github.com/features/actions)
*   **Error Monitoring:** [Sentry](https://sentry.io/)
*   **Logging:** [Pino](https://getpino.io/)

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

Create a `.env.local` file in the root of the project and add the following environment variables:

```
# Vercel Postgres connection string
POSTGRES_URL="your_postgres_connection_string"

# Secret for signing JWTs (must be at least 32 characters long)
JWT_SECRET="your_super_secret_and_long_jwt_secret"

# Sentry DSN for error reporting
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
```

This will run all tests using Jest and provide a coverage report.

## API Endpoints

The following is a summary of the available API endpoints. All endpoints require authentication unless otherwise noted.

### Auth

*   `POST /api/auth/register`: (Public) Register a new organization and factory admin.
*   `POST /api/auth/login`: (Public) Log in to the application.
*   `GET /api/auth/me`: Get the currently authenticated user's information.

### Users

*   `GET /api/users`: Get a list of users in the admin's organization.
*   `POST /api/users`: Invite a new "Floor Staff" user.
*   `PATCH /api/users/{id}`: Update a user's information.
*   `PUT /api/users/{id}/password`: Change a user's password.
*   `PUT /api/users/{id}/reactivate`: Reactivate an inactive user.
*   `GET /api/users/check-username`: Check if a username is available.

### Products

*   `GET /api/products`: Get a paginated list of products.
*   `POST /api/products`: Create a new product.
*   `GET /api/products/{id}`: Get a single product by its ID.
*   `PATCH /api/products/{id}`: Update a product's information.

### Inventory

*   `POST /api/inventory/logs`: Create a new inventory log entry.
*   `GET /api/inventory/logs/me`: Get the authenticated user's inventory logs.
*   `PUT /api/inventory/logs/{id}`: Update an inventory log entry.
*   `DELETE /api/inventory/logs/{id}`: Delete an inventory log entry.
*   `GET /api/inventory/summary/dashboard`: Get a summary of production for the dashboard.
*   `GET /api/inventory/summary/weekly-production`: Get a summary of production for the last week.

### Reports

*   `GET /api/reports/production`: Get a production report.

### Organizations

*   `GET /api/organizations/{id}`: Get an organization's information.
*   `PUT /api/organizations/{id}`: Update an organization's name.

### Utility

*   `GET /api/distinct/{entity}/{field}`: Get a list of distinct values for a given field and entity.
