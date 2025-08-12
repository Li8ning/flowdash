# Project Documentation

This document provides a comprehensive overview of the project, its architecture, APIs, dependencies, and other relevant details.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [UI/UX](#uiux)
- [API Endpoints](#api-endpoints)
- [Dependencies](#dependencies)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

## Project Overview

This is a web application for managing inventory and products. It provides different roles for users, such as `factory_admin` and `floor_staff`, with different levels of access and permissions.

## Architecture

The application is built using the Next.js framework for both the frontend and backend. It uses a PostgreSQL database for data storage.

- **Frontend:** The frontend is built with React and TypeScript, using the Chakra UI component library.
- **Backend:** The backend is built with Next.js API routes.
- **Database:** The application uses a PostgreSQL database, connected via the `@vercel/postgres` library.
- **Authentication:** Authentication is handled using JSON Web Tokens (JWT), with the `jose` library for token signing and verification. The token is stored in an `httpOnly` cookie. Logout is handled by a dedicated API endpoint that instructs the browser to expire the cookie, ensuring a secure session termination.

## UI/UX

### Vertical Sidebar Navigation
The application's user interface was significantly refactored to replace an older, tab-based navigation system with a modern, scalable vertical sidebar.

- **Components:** This involved creating new, dedicated layout components: `src/components/layout/Sidebar.tsx` and `src/components/layout/Header.tsx`.
- **Routing:** The main dashboard layout (`src/app/dashboard/layout.tsx`) was updated to use this new structure. This enables a more intuitive, file-based routing system that provides "pretty" URLs for different sections (e.g., `/dashboard/products`, `/dashboard/inventory`).

### Internationalization (i18n)
The application supports multiple languages (English, Hindi, Gujarati) to provide a better user experience for a diverse user base.

- **Technology:** Uses `i18next` and `react-i18next` for managing translations.
- **Translation Files:** All UI strings are stored in JSON files located at `public/locales/{language}/common.json`.
- **Language Simplification:** Based on user feedback, the Hindi and Gujarati translations have been reviewed and updated to use simpler, more common vocabulary instead of formal or technical terms. This improves usability and comprehension for all users.
- **Dynamic Sidebar:** The main navigation sidebar was refactored to make all links translatable, allowing them to change dynamically based on the user's selected language.

## Security

### Password Transmission

The application's security model for password handling is as follows:

1.  **Data in Transit:** All data transmitted between the client and server, including passwords, is protected by HTTPS (TLS/SSL).
2.  **Data at Rest:** Passwords are hashed on the server using `bcryptjs` before being stored in the database.

## Product Management

### Product Attributes
The application now supports centralized management of product attributes. Admins can define a set of allowed values for attributes like `Category`, `Design` (formerly Series), `Color`, `Quality`, and `Packaging Type`. This ensures consistency and simplifies product creation.

-   **Database:** A new `product_attributes` table stores these values. The `products` table has been updated with `category` and `design` columns.
-   **UI:** The "Add/Edit Product" modals now use dropdowns populated with these attributes, replacing free-text inputs.

### Image Uploads
Product images are uploaded directly through the application, compressed, and stored using Vercel Blob storage.

-   **Technology:** Uses `@vercel/blob` for storage and `sharp` for server-side image compression and resizing.
-   **API:** A dedicated endpoint `POST /api/products/upload-image` handles the file upload.
-   **Image Resizing:** The image processing logic was updated to resize images using `fit: 'inside'` instead of `fit: 'cover'`. This ensures the entire image fits within the 500x500 pixel dimensions without being cropped, preserving its aspect ratio.

### Form Pre-fill for New Products
To accelerate the process of adding multiple similar products, the "Add Product" form has an intelligent pre-fill feature.

-   **Functionality:** After a new product is successfully created, the system temporarily remembers the `Category`, `Design`, and `Color`. When the "Add New Product" button is clicked again within the same session, these fields will be automatically pre-populated.
-   **Scope:** This is a session-only feature. The pre-fill data is cleared upon page reload or logout. Unique fields like `Name`, `SKU`, and `Image` are always left blank.
-   **Note:** This feature replaces the previously considered "Copy Product" functionality as a more streamlined and user-friendly alternative.

### Bulk Product Import via CSV
A standalone page allows admins to import multiple products at once by uploading a CSV file, with detailed feedback on the operation.

-   **Location:** `/dashboard/products/bulk-import`
-   **API:** The `POST /api/products/import` endpoint handles the CSV file processing.
-   **Technology:** Uses `papaparse` for robust CSV parsing and `zod` for row-level validation.
-   **Intelligent Import Logic:**
    -   **Dynamic Attribute Creation:** If the CSV contains a value for `category`, `design`, `color`, `quality`, or `packaging` that does not exist, the system automatically creates the new attribute before importing the product.
    -   **Graceful SKU Handling:** If a product SKU in the CSV already exists in the database, the system silently **skips** that row and continues processing the rest of the file, preventing the entire import from failing.
-   **UI and Reporting:**
    -   The new page provides a user-friendly drag-and-drop interface for uploading the CSV file.
    -   After processing, the API returns a detailed JSON report.
    -   The UI displays this report in a tabbed view, showing:
        -   A list of successfully imported products.
        -   A list of skipped products (with existing SKUs).
        -   A list of rows that contained validation errors.
    -   This replaces the previous, less-detailed modal-based implementation.

### Bulk Image Uploader
A utility page is available for uploading multiple product images simultaneously.

-   **Location:** `/dashboard/products/bulk-image-upload`
-   **Functionality:** Users can drag-and-drop multiple images. The uploader processes them in parallel via the `POST /api/products/bulk-upload-images` endpoint.
-   **Output:** After uploading, the page displays a table of results showing the original filename and its new Vercel Blob URL. From here, users can download a complete, pre-filled `product_import_template.csv`. This CSV uses the filenames as SKUs and populates the `image_url` column with the new URLs, ready for the bulk product import.

## API Endpoints

The following is a list of the main API endpoints and their functionalities:

- **`POST /api/auth/login`**: Authenticates a user and returns a JWT.
- **`GET /api/auth/me`**: Returns the currently authenticated user's details.
- **`GET /api/auth/logout`**: Logs the user out by clearing the authentication cookie.
- **`POST /api/users`**: Creates a new user.
- **`GET /api/users`**: Returns a list of users.
- **`PATCH /api/users/{id}`**: Updates a user's details.
- **`DELETE /api/users/{id}`**: Deactivates a user.
- **`PUT /api/users/{id}/password`**: Updates a user's password.
- **`GET /api/users/check-username`**: Checks if a username is available.
- **`GET /api/products`**: Returns a list of products.
- **`POST /api/products`**: Creates a new product.
- **`PATCH /api/products/{id}`**: Updates a product.
- **`POST /api/products/import`**: Imports products from a CSV file.
- **`POST /api/products/upload-image`**: Uploads a single product image and returns the URL.
- **`POST /api/products/bulk-upload-images`**: Uploads multiple product images and returns their URLs.
- **`GET /api/inventory/logs`**: Returns a list of inventory logs.
- **`POST /api/inventory/logs`**: Creates a new inventory log.
- **`GET /api/inventory/summary/dashboard`**: Returns a summary of the inventory for the dashboard.
- **`GET /api/inventory/summary/weekly-production`**: Returns a summary of the weekly production.
- **`PUT /api/organizations/{id}`**: Updates an organization's details.
- **`GET /api/reports/production`**: Generates a production report.

## Dependencies

### Main Dependencies

- **`next`**: The React framework for production.
- **`react`**: A JavaScript library for building user interfaces.
- **`react-dom`**: Serves as the entry point to the DOM and server renderers for React.
- **`@chakra-ui/react`**: A simple, modular and accessible component library for React.
- **`@vercel/postgres`**: A PostgreSQL client for Vercel Functions.
- **`jose`**: A library for JSON Web Tokens (JWT), JSON Web Signature (JWS), JSON Web Encryption (JWE), etc.
- **`bcryptjs`**: A library to help you hash passwords.
- **`pg`**: Non-blocking PostgreSQL client for Node.js.
- **`@vercel/blob`**: A service for storing files in the cloud.
- **`sharp`**: A high-performance Node.js image processing library.
- **`papaparse`**: A powerful, in-browser CSV parser.
- **`pino`**: A very low overhead Node.js logger.
- **`pino-pretty`**: A Pino log formatter.
- **`axios`**: A promise-based HTTP client for the browser and Node.js.
- **`i18next`**: An internationalization-framework written in and for JavaScript.

### Development Dependencies

- **`typescript`**: A typed superset of JavaScript that compiles to plain JavaScript.
- **`@types/node`**: TypeScript definitions for Node.js.
- **`@types/react`**: TypeScript definitions for React.
- **`@types/react-dom`**: TypeScript definitions for React DOM.
- **`eslint`**: A pluggable and configurable linter tool for identifying and reporting on patterns in JavaScript.
- **`jest`**: A delightful JavaScript Testing Framework with a focus on simplicity.
- **`@testing-library/react`**: Simple and complete React DOM testing utilities that encourage good testing practices.
- **`@testing-library/jest-dom`**: Custom jest matchers to test the state of the DOM.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js
- npm

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username_/Project-Name.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up your environment variables by creating a `.env.local` file. You will need to provide the database connection details and a JWT secret.
    ```
    POSTGRES_URL=...
    JWT_SECRET=...
    BLOB_READ_WRITE_TOKEN=...
    ```
4.  Run the development server
    ```sh
    npm run dev
    ```

## Deployment

The application is deployed on Vercel. The deployment is automatically triggered on every push to the `main` branch.
### Vercel and Neon Database Branching

A critical aspect of the deployment process involves understanding how Neon's database branching works with Vercel's preview deployments.

-   **Automatic Branching:** When you push a new Git branch and Vercel creates a preview deployment, the Neon integration automatically creates a new, separate database branch for it.
-   **Schema and Data:** This new database branch is **empty** by default. It does not automatically inherit the schema or data from your `main` production database.
-   **Resolving "Table Not Found" Errors:** If a preview deployment fails with an error like `relation "..." does not exist`, it means the necessary database tables have not been created on the feature branch's database. To fix this, you have two main options:
    1.  **Run Migrations:** Manually run your SQL migration scripts against the feature branch's database connection string to create the schema.
    2.  **Reset from Parent (Recommended):** In the Neon project dashboard, find your new feature branch, and use the "Reset from Parent" option. This will overwrite the feature branch's database with a complete copy of the schema and data from its parent (usually your `main` branch), immediately bringing it in sync.