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
    4.  After the API call, the client-side state is cleared, and the user is programmatically redirected to the `/login` page to ensure a completely clean state.