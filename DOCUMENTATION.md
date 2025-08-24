# FlowDash - Comprehensive Documentation

This document provides a detailed overview of the FlowDash application, its architecture, features, APIs, and technical implementation. It is intended for developers who may need to maintain, extend, or understand the codebase.

## Table of Contents

- [Project Overview](#project-overview)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
  - [Authentication](#authentication)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Core Features In-Depth](#core-features-in-depth)
  - [User Management](#user-management)
  - [Product Management](#product-management)
  - [Inventory Logging](#inventory-logging)
  - [Internationalization (i18n)](#internationalization-i18n)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Frontend Components](#frontend-components)
- [Deployment](#deployment)

---

## 1. Project Overview

FlowDash is a web-based inventory management system designed for small to medium-sized factories. It provides a user-friendly interface for floor staff to log their work and for factory admins to oversee operations, manage products, and view reports.

### 1.1. Features

*   **User Authentication:** Secure registration and login with session and persistent login options.
*   **Role-Based Access Control (RBAC):** A three-tiered role system with `super_admin` (full control), `admin` (manages floor staff and products), and `floor_staff` (limited to their own logs).
*   **Product Management:** Admins can create, view, update, and manage products, including attributes and images.
*   **Bulk Operations:** Admins can import products via CSV and upload multiple images at once.
*   **Inventory Logging:** Floor staff can log the quantity of products they have produced.
*   **Dashboard & Reporting:** Admins can view production summaries and generate reports.
*   **Multi-language Support:** The UI supports English, Hindi, and Gujarati.
*   **Error Monitoring:** Integrated with Sentry for real-time error tracking.
*   **Structured Logging:** Uses Pino for structured, detailed application logs.

### 1.2. Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v14+ with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [Vercel Postgres](https://vercel.com/storage/postgres)
*   **UI Library:** [Chakra UI](https://chakra-ui.com/)
*   **Authentication:** [JWT](https://jwt.io/) with the `jose` library
*   **Validation:** [Zod](https://zod.dev/) for schema and input validation.
*   **File Storage:** [Vercel Blob](https://vercel.com/storage/blob) for image uploads.
*   **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/) for server-side image compression.
*   **Testing:** [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/)
*   **CI/CD:** [GitHub Actions](https://github.com/features/actions)

---

## 2. Architecture

The application follows a modern monolithic architecture using Next.js, where the frontend and backend are part of the same project.

### 2.1. Frontend

The frontend is built with React and TypeScript, using the Chakra UI component library for a consistent and accessible design system. State management is handled through a combination of React Context (`AuthContext`, `LanguageContext`, `LoadingContext`) and component-level state.

### 2.2. Backend

The backend is built using Next.js API Routes. These are serverless functions that handle all business logic, from database interactions to authentication.

### 2.3. Database

The application uses a Vercel Postgres database. Database queries are executed using the `@vercel/postgres` library, which provides a simple interface for interacting with the database. Database migrations are managed manually via SQL scripts located in `src/lib/migrations`.

### 2.4. Authentication

The authentication system is based on JSON Web Tokens (JWT) stored in secure, `httpOnly` cookies. It supports both session-only and persistent ("Keep me signed in") logins.

#### How it Works:

1.  **Login Request:** The user enters their credentials on the login page. A `rememberMe` boolean flag is sent along with the username and password to the `POST /api/auth/login` endpoint.
2.  **Token Generation & Cookie Setting:** The backend validates the credentials. If they are correct, it generates a JWT using the `jose` library. The token's expiration is set conditionally:
    *   If `rememberMe` is `true`, the token expires in **30 days**.
    *   If `rememberMe` is `false`, the token expires in **1 day**.
    The server then sets this token in an `httpOnly`, `Secure` cookie named `token` in the response. This cookie is automatically managed by the browser and is not accessible to client-side JavaScript, providing protection against XSS attacks.
3.  **Authenticated Requests:** The browser automatically includes the `token` cookie with every subsequent request to the server. A backend middleware (`src/lib/auth.ts`) protects all secure API routes. It extracts the token from the cookie, verifies its signature and expiration using the `JWT_SECRET`, and attaches the user's payload to the request object for use in the API route handlers.
4.  **Logout:** When the user logs out, a request is made to the `GET /api/auth/logout` endpoint. This endpoint sets the `token` cookie with a `maxAge` of -1, instructing the browser to delete it. The `AuthContext` on the frontend clears its local state.

---

## 3. Database Schema

This section provides a high-level overview of the main tables in the FlowDash database.

### `organizations`

This table stores information about the different factory organizations using the application. Each organization acts as a separate tenant.

-   `id`: Unique identifier for the organization.
-   `name`: The name of the organization.

### `users`

This table manages user accounts. Each user belongs to an organization and has a specific role.

-   `id`: Unique identifier for the user.
-   `organization_id`: Foreign key linking to the `organizations` table.
-   `username`: The user's login name.
-   `password_hash`: The user's hashed password.
-   `role`: The user's role (`super_admin`, `admin`, or `floor_staff`).
-   `is_active`: A boolean to activate or deactivate the user account.

### `products`

This table contains the product catalog for each organization.

-   `id`: Unique identifier for the product.
-   `organization_id`: Foreign key linking to the `organizations` table.
-   `sku`: The Stock Keeping Unit for the product.
-   `name`: The name of the product.
-   `image_url`: URL for the product's image.
-   `is_archived`: A boolean to mark a product as archived.

### `inventory_logs`

This is the core table for tracking production. Floor staff create entries here to log the products they have produced.

-   `id`: Unique identifier for the log entry.
-   `product_id`: Foreign key linking to the `products` table.
-   `user_id`: Foreign key linking to the `users` table (the staff member who created the log).
-   `produced`: The quantity of the product that was produced.
-   `quality`: The quality of the produced items (e.g., 'A', 'B').
-   `packaging_type`: The type of packaging used.

### `inventory`

This table provides a real-time summary of the stock levels for each product. It is updated based on the entries in `inventory_logs`.

-   `product_id`: Foreign key linking to the `products` table.
-   `quantity_on_hand`: The current stock level for the product.

### `product_attributes`

This table stores reusable attributes that can be associated with products, such as categories, designs, colors, and packaging types. This helps in standardizing product information.

-   `id`: Unique identifier for the attribute.
-   `organization_id`: Foreign key linking to the `organizations` table.
-   `type`: The type of attribute (e.g., 'category', 'design').
-   `value`: The value of the attribute (e.g., 'Water Closet', 'Designer Series').

For the complete and detailed schema, please see the [`schema_dump.sql`](schema_dump.sql:1) file.

---
## 4. Frontend Components

This section provides an overview of the main React components found in `src/components`.

### 4.1. Core Application & Providers

*   **`Providers.tsx`**: A crucial component that wraps the entire application. It sets up all the necessary context providers (`ChakraProvider`, `AuthProvider`, `LanguageProvider`, `LoadingProvider`) so that they are available to all child components.
*   **`AppInitializer.tsx`**: This component is responsible for initializing the application state when it first loads. It checks for an existing user session and fetches initial data.
*   **`GlobalSpinner.tsx`**: Listens to the `LoadingContext` and displays a full-screen loading spinner whenever a global loading state is active (e.g., during page transitions or major data fetches).
*   **`WithAuth.tsx`**: A Higher-Order Component (HOC) that wraps pages or components requiring authentication. It checks if a user is logged in; if not, it redirects them to the login page.

### 4.2. Authentication & User Management

*   **`Login.tsx`**: Renders the login form, handles user input, and calls the authentication API. Includes the "Keep me signed in" functionality.
*   **`Register.tsx`**: Renders the registration form for new organizations and factory admins.
*   **`UserManager.tsx`**: A full-featured component for factory admins to view, invite, edit, and deactivate users within their organization.
*   **`ProfileManager.tsx`**: Allows the currently logged-in user to update their own profile information, such as their name and password.
*   **`UserProfileForm.tsx`**: A reusable form component used by both `UserManager` and `ProfileManager` for editing user details.

#### 4.2.1. Role Creation Hierarchy

The application enforces a strict hierarchy for user creation to maintain security and organizational structure.

*   **`super_admin`**: Can only be created through the public registration form (`/register`). They cannot be created from within the application by another user. A `super_admin` can create `admin` and `floor_staff` users.
*   **`admin`**: Can only be created by a `super_admin`. An `admin` can only create `floor_staff` users.
*   **`floor_staff`**: Can be created by either a `super_admin` or an `admin`. They have no user creation privileges.

This logic is enforced in the backend API (`/api/users`) and reflected in the frontend UI (`UserManager.tsx`).
### 4.3. Product & Inventory Management

*   **`ProductManager.tsx`**: The main interface for admins to manage the product catalog. It includes features for viewing, searching, filtering, adding, editing, and archiving products.
*   **`ProductAttributesManager.tsx`**: A component for managing the centralized product attributes (Category, Design, Color, etc.). Found on the product settings page.
*   **`ProductSelector.tsx`**: A reusable dropdown component that allows users to search for and select a product. Used in the inventory logging flow.
*   **`InventoryLogs.tsx`**: The primary interface for `floor_staff` to log their production. It also allows admins to view all logs, with comprehensive filtering options. It features a debounced search bar for product names, along with dropdown filters for user, color, design, quality, packaging type, and date range.
*   **`EditLogModal.tsx`**: A modal dialog that allows users to edit their existing inventory log entries.

### 4.4. Dashboards & Reporting

*   **`ProductionDashboard.tsx`**: The main dashboard page that displays key performance indicators (KPIs) and summaries of production data.
*   **`WeeklyProductionChart.tsx`**: A bar chart component that visualizes the production totals for the last seven days.

---

## 5. Context Providers

The application uses the React Context API for global state management. The providers are set up in `src/components/Providers.tsx`.

### 5.1. `AuthContext` (`src/context/AuthContext.tsx`)

This is the most critical context, managing the application's authentication state.

*   **State:**
    *   `isAuthenticated`: A boolean indicating if a user is currently logged in.
    *   `user`: An object containing the authenticated user's details (id, name, role, etc.).
    *   `token`: The raw JWT.
*   **Functions:**
    *   `login(username, password, rememberMe)`: Handles the login process, calls the API, and stores the token.
    *   `logout()`: Clears the token from storage and resets the authentication state.
    *   `handleAuthentication(token, rememberMe)`: A core function to process a new token, store it in the correct Web Storage (`localStorage` or `sessionStorage`), and update the application state.
    *   `checkAuth()`: Checks for a token in storage on application load to maintain the session.

### 5.2. `LanguageContext` (`src/context/LanguageContext.tsx`)

Manages the application's internationalization (i18n) state.

*   **State:**
    *   `language`: The currently selected language code (e.g., 'en', 'hi', 'gu').
*   **Functions:**
    *   `changeLanguage(lang)`: Changes the application's language. It updates the `i18next` instance and persists the user's preference.

### 5.3. `LoadingContext` (`src/context/LoadingContext.tsx`)

Manages the global loading state, allowing any component to trigger the global loading spinner.

*   **State:**
    *   `isLoading`: A boolean indicating if the global spinner should be visible.
*   **Functions:**
    *   `showLoading()`: Sets `isLoading` to `true`.
    *   `hideLoading()`: Sets `isLoading` to `false`.

---

## 6. API Endpoints

The backend is exposed via a set of RESTful API endpoints. All endpoints under `/api` are handled by Next.js API Routes.

**Authentication is required for all endpoints unless marked as (Public).**

### 6.1. Auth

*   `POST /api/auth/register` **(Public)**
    *   Registers a new organization and its first `factory_admin` user.
*   `POST /api/auth/login` **(Public)**
    *   Authenticates a user and returns a JWT. Accepts a `rememberMe` flag to determine token expiration.
*   `POST /api/auth/logout`
    *   This endpoint is a placeholder. Logout is handled entirely on the client-side by clearing the token from Web Storage.
*   `GET /api/auth/me`
    *   Returns the profile of the currently authenticated user.

### 6.2. Users

*   `GET /api/users`
    *   Retrieves a list of all users within the admin's organization.
*   `POST /api/users`
    *   Creates a new user (`admin` or `floor_staff`). The available roles to create depend on the role of the user making the request.
*   `PATCH /api/users/{id}`
    *   Updates a user's details (e.g., name, role).
*   `DELETE /api/users/{id}`
    *   Deactivates a user account by setting `is_active` to `false`.
*   `PUT /api/users/{id}/password`
    *   Updates a user's password.
*   `PUT /api/users/{id}/reactivate`
    *   Reactivates a disabled user account.
*   `GET /api/users/check-username`
    *   Checks if a username is already taken within an organization.

### 6.3. Products

*   `GET /api/products`
    *   Retrieves a paginated and filterable list of products. Supports filtering by `category`, `design`, and searching by `name` or `sku`.
*   `POST /api/products`
    *   Creates a new product.
*   `GET /api/products/{id}`
    *   Retrieves a single product by its ID.
*   `PATCH /api/products/{id}`
    *   Updates an existing product's information.
*   `POST /api/products/import`
    *   Handles bulk product import from a CSV file.
*   `POST /api/products/upload-image`
    *   Uploads a single product image to Vercel Blob and returns the URL.
*   `POST /api/products/bulk-upload-images`
    *   Uploads multiple product images in parallel.

### 6.4. Product Attributes (Settings)

*   `GET /api/settings/attributes`
    *   Retrieves all product attributes for the organization.
*   `POST /api/settings/attributes`
    *   Creates a new product attribute.
*   `DELETE /api/settings/attributes/{id}`
    *   Deletes a product attribute.

### 6.5. Inventory

*   `GET /api/inventory/logs`
    *   Retrieves a paginated list of all inventory logs for the organization.
*   `POST /api/inventory/logs`
    *   Creates a new inventory log entry.
*   `GET /api/inventory/logs/me`
    *   Retrieves the inventory logs for the currently authenticated `floor_staff` user.
*   `PUT /api/inventory/logs/{id}`
    *   Updates an existing inventory log.
*   `DELETE /api/inventory/logs/{id}`
    *   Deletes an inventory log.

### 6.6. Dashboard & Reports

*   `GET /api/inventory/summary/dashboard`
    *   Retrieves aggregated data for the main dashboard KPIs.
*   `GET /api/inventory/summary/weekly-production`
    *   Retrieves data for the weekly production chart.
---

## 7. Security Remediations

This section details the security vulnerabilities that have been identified and addressed in the application.

### 7.1. SQL Injection in `GET /api/distinct/{entity}/{field}` (Fixed)

*   **Vulnerability:** The original implementation of this dynamic endpoint was vulnerable to SQL injection. The `entity` and `field` parameters from the URL were directly interpolated into the SQL query string without proper sanitization. An attacker could manipulate these parameters to execute arbitrary SQL commands.

*   **Fix:** The endpoint was rewritten to use a whitelisting approach. A predefined `allowedTables` object now maps safe, developer-approved entity names to their actual table names and permissible fields. Any request for an entity or field not on this whitelist is rejected with a `403 Forbidden` error. This ensures that only pre-approved, safe queries can be executed, completely mitigating the injection risk.
*   `GET /api/reports/production`
    *   Generates and returns a production report based on specified filters.

### 6.7. Utility

*   `GET /api/distinct/{entity}/{field}`
    *   A utility endpoint to get a list of distinct values for a specific field in a table (e.g., distinct product categories).

---