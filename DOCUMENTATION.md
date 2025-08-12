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
*   **Role-Based Access Control (RBAC):** Differentiated permissions for `factory_admin` (full access) and `floor_staff` (limited to their own logs).
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

The authentication system is based on JSON Web Tokens (JWT). It supports both session-only and persistent ("Keep me signed in") logins.

#### How it Works:

1.  **Login Request:** The user enters their credentials on the login page. A `rememberMe` boolean flag is sent along with the username and password to the `POST /api/auth/login` endpoint.
2.  **Token Generation:** The backend validates the credentials. If they are correct, it generates a JWT using the `jose` library. The token's expiration is set conditionally:
    *   If `rememberMe` is `true`, the token expires in **30 days**.
    *   If `rememberMe` is `false`, the token expires in **1 day**.
3.  **Token Storage:** The generated token is sent back to the client. The `AuthContext` on the frontend is responsible for storing this token:
    *   If `rememberMe` is `true`, the token is stored in **`localStorage`**. This persists the token even after the browser is closed.
    *   If `rememberMe` is `false`, the token is stored in **`sessionStorage`**. This token is cleared when the browser session ends (i.e., the tab or window is closed).
4.  **Authenticated Requests:** An Axios request interceptor (`src/lib/api.js`) is configured to run before every API call. It reads the token from either `localStorage` or `sessionStorage` and adds it to the `Authorization` header of the request:
    ```
    Authorization: Bearer <jwt_token>
    ```
5.  **Token Verification:** A backend middleware (`src/lib/auth.ts`) protects all secure API routes. It extracts the token from the `Authorization` header, verifies its signature and expiration using the `JWT_SECRET`, and attaches the user's payload to the request object for use in the API route handlers.
6.  **Logout:** When the user logs out, the `AuthContext` explicitly removes the token from both `localStorage` and `sessionStorage` to ensure the session is terminated.

This approach replaces the previous `httpOnly` cookie-based method to provide more flexible, client-side control over session persistence.

---
---

## 3. Database Schema

The database consists of the following core tables. Primary keys are marked with 🔑 and foreign keys with 🔗.

### 3.1. `organizations`

Stores information about the organizations (factories) using the application.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` 🔑 | `integer` | NOT NULL, PRIMARY KEY | Unique identifier for the organization. |
| `name` | `varchar(255)` | NOT NULL | The name of the organization. |
| `created_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of when the record was created. |
| `updated_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of the last update. |

### 3.2. `users`

Stores user accounts. Each user belongs to an organization.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` 🔑 | `integer` | NOT NULL, PRIMARY KEY | Unique identifier for the user. |
| `organization_id` 🔗 | `integer` | FOREIGN KEY -> organizations(id) | The organization this user belongs to. |
| `username` | `varchar(255)` | NOT NULL, UNIQUE (with organization_id) | The user's login name. |
| `name` | `varchar(255)` | | The user's full name. |
| `password_hash` | `varchar(255)` | NOT NULL | The user's hashed password. |
| `role` | `varchar(50)` | NOT NULL, CHECK (`factory_admin` or `floor_staff`) | The user's role, which determines their permissions. |
| `is_active` | `boolean` | DEFAULT true | Whether the user account is active or disabled. |
| `language` | `varchar(10)` | DEFAULT 'en' | The user's preferred language for the UI. |
| `created_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of when the record was created. |
| `updated_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of the last update. |

### 3.3. `product_attributes`

A central table to store predefined values for various product attributes, ensuring data consistency.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` 🔑 | `integer` | NOT NULL, PRIMARY KEY | Unique identifier for the attribute. |
| `organization_id` 🔗 | `integer` | NOT NULL, FOREIGN KEY -> organizations(id) | The organization these attributes belong to. |
| `type` | `varchar(50)` | NOT NULL, UNIQUE (with org_id, value) | The type of attribute (e.g., 'category', 'design', 'color'). |
| `value` | `varchar(255)` | NOT NULL, UNIQUE (with org_id, type) | The actual value of the attribute (e.g., 'Water Closet', 'Designer', 'Blue'). |
| `created_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of when the record was created. |
| `updated_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of the last update. |

### 3.4. `products`

Stores the product catalog for each organization.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` 🔑 | `integer` | NOT NULL, PRIMARY KEY | Unique identifier for the product. |
| `organization_id` 🔗 | `integer` | FOREIGN KEY -> organizations(id) | The organization this product belongs to. |
| `sku` | `varchar(100)` | NOT NULL, UNIQUE (with organization_id) | The unique Stock Keeping Unit for the product. |
| `name` | `varchar(255)` | NOT NULL | The product's name. |
| `category` | `varchar(255)` | | The product's category (from `product_attributes`). |
| `design` | `varchar(255)` | | The product's design/series (from `product_attributes`). |
| `color` | `varchar(100)` | | The product's color (from `product_attributes`). |
| `image_url` | `text` | | URL of the product's image, hosted on Vercel Blob. |
| `available_qualities` | `text[]` | | Array of available quality levels (from `product_attributes`). |
| `available_packaging_types` | `text[]` | | Array of available packaging types (from `product_attributes`). |
| `is_archived` | `boolean` | DEFAULT false | Whether the product is archived and hidden from view. |
| `created_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of when the record was created. |
| `updated_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of the last update. |

### 3.5. `inventory_logs`

Records production entries made by `floor_staff` users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` 🔑 | `integer` | NOT NULL, PRIMARY KEY | Unique identifier for the log entry. |
| `product_id` 🔗 | `integer` | FOREIGN KEY -> products(id) | The product that was produced. |
| `user_id` 🔗 | `integer` | FOREIGN KEY -> users(id) | The user who logged the production. |
| `produced` | `integer` | NOT NULL | The quantity of items produced. |
| `quality` | `text` | | The quality of the produced items. |
| `packaging_type` | `text` | | The packaging type used. |
| `created_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of when the log was created. |
| `updated_at` | `timestamptz` | DEFAULT CURRENT_TIMESTAMP | Timestamp of the last update. |

---
## 4. Frontend Components

This section provides an overview of the main React components found in `src/components`.

### 4.1. Core Application &amp; Providers

*   **`Providers.tsx`**: A crucial component that wraps the entire application. It sets up all the necessary context providers (`ChakraProvider`, `AuthProvider`, `LanguageProvider`, `LoadingProvider`) so that they are available to all child components.
*   **`AppInitializer.tsx`**: This component is responsible for initializing the application state when it first loads. It checks for an existing user session and fetches initial data.
*   **`GlobalSpinner.tsx`**: Listens to the `LoadingContext` and displays a full-screen loading spinner whenever a global loading state is active (e.g., during page transitions or major data fetches).
*   **`WithAuth.tsx`**: A Higher-Order Component (HOC) that wraps pages or components requiring authentication. It checks if a user is logged in; if not, it redirects them to the login page.

### 4.2. Authentication &amp; User Management

*   **`Login.tsx`**: Renders the login form, handles user input, and calls the authentication API. Includes the "Keep me signed in" functionality.
*   **`Register.tsx`**: Renders the registration form for new organizations and factory admins.
*   **`UserManager.tsx`**: A full-featured component for factory admins to view, invite, edit, and deactivate users within their organization.
*   **`ProfileManager.tsx`**: Allows the currently logged-in user to update their own profile information, such as their name and password.
*   **`UserProfileForm.tsx`**: A reusable form component used by both `UserManager` and `ProfileManager` for editing user details.

### 4.3. Product &amp; Inventory Management

*   **`ProductManager.tsx`**: The main interface for admins to manage the product catalog. It includes features for viewing, searching, filtering, adding, editing, and archiving products.
*   **`ProductAttributesManager.tsx`**: A component for managing the centralized product attributes (Category, Design, Color, etc.). Found on the product settings page.
*   **`ProductSelector.tsx`**: A reusable dropdown component that allows users to search for and select a product. Used in the inventory logging flow.
*   **`InventoryLogs.tsx`**: The primary interface for `floor_staff` to log their production. It also allows admins to view all logs.
*   **`EditLogModal.tsx`**: A modal dialog that allows users to edit their existing inventory log entries.

### 4.4. Dashboards &amp; Reporting

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
    *   Creates a new `floor_staff` user.
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
*   `GET /api/reports/production`
    *   Generates and returns a production report based on specified filters.

### 6.7. Utility

*   `GET /api/distinct/{entity}/{field}`
    *   A utility endpoint to get a list of distinct values for a specific field in a table (e.g., distinct product categories).

---