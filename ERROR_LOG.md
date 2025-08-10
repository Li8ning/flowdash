# Error Log

This file logs all errors encountered during development and debugging, along with their causes and resolutions.

---

## Session: 2025-08-08

### 1. Unable to update users from admin panel

-   **Error:** `PUT http://localhost:3000/api/users/2 405 (Method Not Allowed)`
-   **Cause:** The frontend was sending a `PUT` request to update user details, but the backend API route only supported the `PATCH` method.
-   **Location:**
    -   Frontend: `src/components/UserProfileForm.tsx`
    -   Backend: `src/app/api/users/[id]/route.ts`
-   **Resolution:**
    1.  Updated the `patchHandler` in the backend to accept `username` in the payload.
    2.  Changed the frontend to send a `PATCH` request instead of `PUT`.

### 2. Unable to delete users from admin panel

-   **Error:** `DELETE http://localhost:3000/api/users/3 405 (Method Not Allowed)`
-   **Cause:** The backend API route for user management was missing a handler for `DELETE` requests.
-   **Location:**
    -   Frontend: `src/components/UserManager.tsx`
    -   Backend: `src/app/api/users/[id]/route.ts`
-   **Resolution:** Added a `deleteHandler` to the API route to handle user deactivation.

### 3. Username can be updated to a duplicate value

-   **Error:** The application was showing a success message when updating a username to one that was already taken, but the database was not updated.
-   **Cause:**
    1.  The initial fix attempt failed because the backend validation was case-sensitive, while the frontend check was not.
    2.  The second fix attempt failed because the `ProfileManager.tsx` component was not sending the `username` in the update payload.
-   **Location:**
    -   Backend: `src/app/api/users/[id]/route.ts`
    -   Frontend: `src/components/ProfileManager.tsx`
-   **Resolution:**
    1.  Made the backend username validation case-insensitive.
    2.  Added the `username` to the update payload in `ProfileManager.tsx`.
    3.  Updated the error message handling in `ProfileManager.tsx` to display the specific error message from the backend.

### 4. Updating password logs the user out

-   **Error:** The user was being logged out after a successful password update.
-   **Cause:** The backend was not returning a new JWT after the password was changed, causing the user's session to become invalid. A mistake was also made by introducing `jsonwebtoken` when `jose` was the standard.
-   **Location:**
    -   Backend: `src/app/api/users/[id]/password/route.ts`
    -   Frontend: `src/components/ProfileManager.tsx`
-   **Resolution:**
    1.  Removed the `jsonwebtoken` dependency.
    2.  Updated the password change API to use `jose` to generate and return a new JWT.
    3.  Updated the frontend to receive the new token and update the user's session.
    4.  Improved the error message handling on the frontend.

### 5. Logged out when entering incorrect password

-   **Error:** The user was being logged out when they entered an incorrect password on the profile page.
-   **Cause:** The backend was returning a 401 Unauthorized status, which was being caught by a global `axios` interceptor that redirects to the login page.
-   **Location:** `src/lib/api.js`
-   **Resolution:** Updated the `axios` interceptor to not redirect to the login page if the error is from the password update endpoint. This allows the component to handle the error and display the correct message.

---

## Session: 2025-08-08 (Continued)

### 6. Stale session after logout

-   **Error:** After logging out as one user and logging in as another, the application would sometimes show the previous user's session and data.
-   **Cause:** The logout process was handled purely on the client-side by clearing local state and attempting to remove the cookie via JavaScript. This is unreliable for `httpOnly` cookies, which are protected from client-side script access. The cookie was not being properly destroyed.
-   **Location:**
    -   Client: `src/context/AuthContext.tsx`
-   **Resolution:**
    1.  Created a new server-side API endpoint at `src/app/api/auth/logout/route.ts`.
    2.  This endpoint's only function is to set the `token` cookie with a `maxAge` of -1, which securely instructs the browser to delete it.
    3.  Updated the `logout` function in `AuthContext.tsx` to be an `async` function that calls this new API endpoint.
    4.  After the API call, a client-side state is cleared, and the user is programmatically redirected to the `/login` page to ensure a completely clean state.
---

## Session: 2025-08-10

### 7. i18n JSON parsing errors

-   **Error:** Translations were not loading correctly, and errors appeared in the browser console related to JSON parsing.
-   **Cause:** The `common.json` files for Gujarati (`gu`) and Hindi (`hi`) contained multiple duplicate keys, which is invalid JSON.
-   **Location:**
    -   `public/locales/gu/common.json`
    -   `public/locales/hi/common.json`
-   **Resolution:** Manually identified and removed the duplicate keys from both JSON files, ensuring they were well-formed.

### 8. Image upload fails with "Token not found"

-   **Error:** `BlobError: No token found.` when trying to upload a product image.
-   **Cause:** The `BLOB_READ_WRITE_TOKEN` environment variable required by Vercel Blob storage was missing from the `.env.local` file. The file had also been cluttered with many non-essential variables.
-   **Location:** `.env.local`
-   **Resolution:**
    1.  Guided the user to create a new Vercel Blob store and retrieve the correct token.
    2.  Cleaned up the `.env.local` file to contain only the essential variables (`BLOB_READ_WRITE_TOKEN`, `POSTGRES_URL`, etc.), resolving the authentication issue.

### 9. Category and Design fields not saving

-   **Error:** When creating or editing a product, the "Category" and "Design" fields were not being saved to the database.
-   **Cause:**
    1.  **Create:** The `products` table was missing the `category` and `design` columns. The backend API for creation was not handling these new fields.
    2.  **Update:** The `PATCH /api/products/{id}` endpoint was not updated to handle the `category` and `design` fields in its validation schema or its SQL query.
-   **Location:**
    -   Database Migration: `src/lib/migrations/002_add_category_and_design_to_products.sql`
    -   Backend (Create): `src/app/api/products/route.ts`
    -   Backend (Update): `src/app/api/products/[id]/route.ts`
-   **Resolution:**
    1.  Created a database migration to add the `category` and `design` columns to the `products` table and rename the 'series' attribute to 'design'.
    2.  Updated the `POST /api/products` route to include the new fields in the `INSERT` query.
    3.  Updated the `PATCH /api/products/{id}` route's Zod schema and `UPDATE` query to handle the new fields.

### 10. Product table does not refresh after creation

-   **Error:** After creating a new product, the product list on the "Product Management" page would disappear until the page was manually refreshed.
-   **Cause:** The data fetching logic was flawed. The component would clear the existing product list (`setProducts([])`) but would not reliably trigger the `useEffect` to refetch the data if the current page number hadn't changed.
-   **Location:** `src/components/ProductManager.tsx`
-   **Resolution:**
    1.  Refactored the data fetching logic into a standalone `fetchProducts` function.
    2.  This function is now called directly after a product is created or archived, with a parameter to force a reset to the first page (`fetchProducts(true)`).
    3.  This ensures the product list is always requeried from the server, providing a fresh and accurate view.