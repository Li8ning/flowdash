# Project Documentation

This document provides a comprehensive overview of the project, its architecture, APIs, dependencies, and other relevant details.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
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
- **Authentication:** Authentication is handled using JSON Web Tokens (JWT), with the `jose` library for token signing and verification.

## Security

### Password Transmission

The application's security model for password handling is as follows:

1.  **Data in Transit:** All data transmitted between the client and server, including passwords, is protected by HTTPS (TLS/SSL).
2.  **Data at Rest:** Passwords are hashed on the server using `bcryptjs` before being stored in the database.

## API Endpoints

The following is a list of the main API endpoints and their functionalities:

- **`POST /api/auth/login`**: Authenticates a user and returns a JWT.
- **`GET /api/auth/me`**: Returns the currently authenticated user's details.
- **`POST /api/users`**: Creates a new user.
- **`GET /api/users`**: Returns a list of users.
- **`PATCH /api/users/{id}`**: Updates a user's details.
- **`DELETE /api/users/{id}`**: Deactivates a user.
- **`PUT /api/users/{id}/password`**: Updates a user's password.
- **`GET /api/users/check-username`**: Checks if a username is available.
- **`GET /api/products`**: Returns a list of products.
- **`POST /api/products`**: Creates a new product.
- **`PATCH /api/products/{id}`**: Updates a product.
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
    ```
4.  Run the database migrations
    ```sh
    npm run migrate up
    ```
5.  Run the development server
    ```sh
    npm run dev
    ```

## Deployment

The application is deployed on Vercel. The deployment is automatically triggered on every push to the `main` branch. Database migrations are configured to run automatically as part of the build process, ensuring the schema is always synchronized with the application code.