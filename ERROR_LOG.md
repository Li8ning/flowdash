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
---

## Session: 2025-08-11

### 11. Content Security Policy (CSP) Error for Vercel Blob Images

-   **Error:** Browser console showed errors indicating that images from `*.public.blob.vercel-storage.com` were being blocked due to the Content Security Policy.
-   **Cause:** The `next.config.mjs` file was missing the correct hostname for Vercel Blob storage in its `images.remotePatterns` configuration.
-   **Location:** `next.config.mjs`
-   **Resolution:** Added a new pattern `{ protocol: 'https', hostname: 'n05yfrwzk19unv0g.public.blob.vercel-storage.com' }` to the `remotePatterns` array to explicitly allow images from this source.

### 12. Bulk Image Upload fails on existing files

-   **Error:** The bulk image uploader would stop processing if it encountered a file that already existed in the blob storage, throwing a generic error.
-   **Cause:** The error handling logic in the `POST /api/products/bulk-upload-images` endpoint was catching a generic `Error` object. It was not specifically identifying the `BlobNotFoundError` thrown by the `@vercel/blob` library when using the `put(..., { addRandomSuffix: false })` option.
-   **Location:** `src/app/api/products/bulk-upload-images/route.ts`
-   **Resolution:**
    1.  Imported the `BlobNotFoundError` type from `@vercel/blob`.
    2.  Updated the `catch` block to check if the error is an `instanceof BlobNotFoundError`.
    3.  If it is, the error is handled gracefully by adding an `{ fileName, error: 'File with this name already exists.' }` object to the results array.
    4.  If it's a different error, it is re-thrown to be handled by the outer error boundary. This makes the uploader more resilient and provides clearer feedback to the user.

### 13. Obsolete 'model' column not removed from import API

-   **Error:** An unsaved file was reported, and investigation revealed that the `model` column, which was supposed to be deprecated, was still present in the backend CSV import logic.
-   **Cause:** A previous `apply_diff` operation to remove the column was incomplete or had failed.
-   **Location:** `src/app/api/products/import/route.ts`
-   **Resolution:** Re-ran the `apply_diff` operation to remove the `model` field from the Zod validation schema, the `INSERT` statement, and the values array in the API route.

### 14. Unused import in ProductImportModal

-   **Error:** ESLint reported an error: `'Link' is defined but never used.`
-   **Cause:** The `Link` component from Chakra UI was imported but was no longer being used in the component.
-   **Location:** `src/components/ProductImportModal.tsx`
-   **Resolution:** Removed the unused `Link` from the import statement at the top of the file.

### 15. Blank page after logout

-   **Error:** After clicking the logout button, the user was redirected to `/login` which appeared as a blank page.
-   **Cause:** The `logout` function in the `AuthContext` was programmatically redirecting to `/login`. However, the application's routing is set up so that the login page is at the root (`/`). The `/login` route does not exist, causing Next.js to render a 404 page, which appeared blank.
-   **Location:** `src/context/AuthContext.tsx`
-   **Resolution:** Modified the `logout` function within `AuthContext.tsx` to change the redirect from `router.push('/login')` to `router.push('/')`. This correctly sends the user to the actual login page after their session is terminated.
---

## Session: 2025-08-12

### 16. 500 Server Error on Vercel Preview Deployment

-   **Error:** `NeonDbError: relation "product_attributes" does not exist`. This error occurred only on Vercel preview deployments, not locally.
-   **Cause:** The Neon database integration with Vercel creates a new, empty database branch for each Git feature branch. The `features/system-improvements` branch was connected to a new database that did not have the schema (i.e., the tables) that existed in the `main` branch's database.
-   **Location:** Vercel/Neon Infrastructure.
-   **Resolution:** The user resolved the issue by using the "Reset from Parent" option in the Neon dashboard for the feature branch. This action copied the entire schema and data from the `main` database branch to the feature database branch, ensuring the necessary tables existed. The debugging code added to the API route was subsequently reverted.