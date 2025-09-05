# FlowDash - Inventory Management System

**Version: 0.6.3**

FlowDash is a web-based inventory management system designed specifically for small to medium-sized factories, particularly in the Indian market. It provides a simple, user-friendly platform for factory owners and floor staff to track production, manage inventory, and gain insights into their operations.

## Key Features

*   **Role-Based Access Control (RBAC):** Three-tiered role system with `super_admin` (full control), `admin` (manages floor staff and products), and `floor_staff` (limited to their own logs).
*   **Product Management:** Create, update, and manage products with attributes like color, design, quality, and packaging types. Includes bulk CSV import and image upload capabilities.
*   **Media Library:** Centralized image management system with upload, view, edit, and delete capabilities. Features WordPress-style interface, bulk operations, drag-and-drop uploads, and automatic image optimization.
*   **Stock Management:** Comprehensive finished goods inventory tracking with separate rows for each product variant (quality + packaging combination). Features advanced filtering, pagination, and zero stock visibility toggle.
*   **Inventory Logging:** Floor staff can log production quantities with detailed tracking of who made changes and when.
*   **User Management:** Invite, edit, deactivate, and reactivate user accounts with strict role hierarchy enforcement.
*   **Multi-language Support:** Full internationalization support for English, Hindi, and Gujarati languages, optimized for factory workers with limited technical literacy.
*   **Data Export:** Export inventory logs to PDF and Excel formats with comprehensive filtering options.
*   **Dashboard Analytics:** Production summaries, weekly charts, and real-time inventory tracking.
*   **Mobile-First Design:** Responsive interface optimized for tablets and smartphones used by floor staff.
*   **Accessibility:** WCAG-compliant design with proper visual feedback through color-coded buttons (red for destructive actions, green for positive actions, blue for primary actions).

## Tech Stack

*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript
*   **UI Library:** Chakra UI
*   **Database:** Vercel Postgres
*   **File Storage:** Vercel Blob
*   **Authentication:** JWT with Jose library
*   **Validation:** Zod
*   **API:** Next.js API Routes (Serverless Functions)
*   **Image Processing:** Sharp
*   **Testing:** Jest, React Testing Library, Playwright
*   **Error Monitoring:** Sentry
*   **Logging:** Pino
*   **Internationalization:** i18next, react-i18next
*   **Deployment:** Vercel
*   **CI/CD:** GitHub Actions

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
    POSTGRES_URL="your_vercel_postgres_connection_string"
    JWT_SECRET="your_jwt_secret_key"
    BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"
    SENTRY_DSN="your_sentry_dsn" (optional)
    ```

4.  **Run the database migrations:**
    Execute the SQL migration files in the `src/lib/migrations` directory against your Vercel Postgres database to set up the schema.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## Recent Updates (v0.6.3)

### Bulk Import Image Optimization
- **Advanced Image Processing**: Implemented Sharp-based image optimization with automatic resizing (500x500px) and WebP conversion for 60-80% file size reduction
- **Hash-Based Duplicate Detection**: Added SHA-256 content hashing to prevent storage waste from identical images across bulk import, media library, and single uploads
- **Parallel Processing**: Implemented controlled parallel image processing (3 concurrent uploads) for 3x faster bulk imports on Vercel free plan
- **Smart Filename Handling**: Base filenames stored in database, Vercel Blob handles uniqueness with random suffixes
- **Comprehensive Error Handling**: 30-second timeouts, graceful failure recovery, and detailed logging for robust operation
- **Database Schema Enhancement**: Added content_hash column with performance index for efficient duplicate detection
- **Cross-Platform Consistency**: Unified image processing logic across bulk import, media library, and single product uploads

## Previous Updates (v0.6.2)

### Media Management UI/UX Enhancements
- **Upload Flow Streamlining**: Removed redundant collision detection code, added upload progress feedback with visual indicators, and fixed React key warnings in ImageSelector component
- **Deletion Experience Improvements**: Replaced browser alerts with native Chakra UI AlertDialogs for both single and bulk deletions, added comprehensive loading states, and implemented automatic media library refresh without page reloads
- **Enhanced Error Handling**: Improved error messages with specific context and graceful failure handling for all media operations
- **Translation System Updates**: Fixed translation message templates and added new keys for upload success messages across all supported languages (English, Hindi, Gujarati)
- **Code Quality & Performance**: Removed debug console.log messages, optimized custom event handling for cross-component communication, and ensured clean, maintainable codebase
- **Build Verification**: All changes compile successfully with proper TypeScript types and no linting errors

## Previous Updates (v0.6.1)

### Product Management & UI Enhancements
- **Smart CSV Import**: Enhanced product import with intelligent image_url support and automatic media library integration
- **Image Preview Optimization**: Fixed image loading in edit mode, eliminated unnecessary API calls, and improved preview update handling
- **Database Integrity**: Resolved media_id column errors and optimized product-media relationship handling
- **UI/UX Improvements**: Added comprehensive loading feedback, removed debug messages, and cleaned up modal interfaces
- **Media Library Fixes**: Excluded archived products from linked products list while preserving data integrity
- **Code Quality**: Fixed all ESLint warnings, removed unused imports, and optimized React hooks dependencies

---

📋 **Complete Change History**: See [CHANGELOG.md](CHANGELOG.md) for all previous versions and detailed changes.

## CI/CD

The project includes a GitHub Actions workflow that performs:
*   **Linting:** Code style enforcement
*   **Testing:** Unit and integration tests
*   **Security Scanning:** Vulnerability detection
*   **Type Checking:** TypeScript validation

## Contributing

The application uses a Memory Bank system (`.kilocode/rules/memory-bank/`) to maintain project knowledge and context for developers. Please review the memory bank files before making significant changes.
