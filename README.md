# FlowDash - Inventory Management System

**Version: 0.6.0**

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

## Recent Updates (v0.6.0)

### Media Library System
- **Complete Media Management**: Implemented comprehensive centralized image management system with WordPress-style interface
- **Drag-and-Drop Upload**: Inline expandable upload area with drag-and-drop functionality and visual feedback
- **Bulk Operations**: WordPress-style bulk select with visual feedback, bulk delete, and bulk actions
- **Advanced Search**: Debounced search (500ms delay) with real-time filtering across filename and metadata
- **Image Optimization**: Automatic image processing with Sharp (resize, WebP conversion, quality optimization)
- **Responsive Design**: Mobile-first design with custom breakpoints (2-12 columns based on screen size)
- **Navigation Integration**: New Media submenu with Library and Upload Media options
- **Modal Viewer**: Two-column layout with navigation arrows, file details, and direct deletion
- **File Management**: Windows-style duplicate handling (filename.jpg, filename (1).jpg, etc.)
- **Database Architecture**: New media tables with organization isolation and foreign key relationships
- **API Consolidation**: Unified upload endpoint with proper error handling and progress tracking
- **Multi-language Support**: Complete internationalization for English, Hindi, and Gujarati
- **Security**: Role-based access control (admin/super-admin only) with proper validation

### Previous Updates (v0.5.3)

### Pagination Bug Fixes & API Improvements
- **Critical Pagination Fixes**: Resolved duplicate records appearing across different pages in product management
- **Deterministic Ordering**: Added secondary sort keys (id DESC) to all paginated queries to prevent non-deterministic results
- **API Consistency**: Standardized all pagination APIs to use page-based parameters instead of offset-based
- **Comprehensive Audit**: Reviewed and fixed potential pagination issues across all APIs (products, inventory logs, stock management)
- **Type Safety**: Replaced explicit 'any' types with proper TypeScript interfaces for better code reliability

### Code Quality & Performance (v0.5.2)
- **ESLint Compliance**: Fixed all ESLint warnings and errors across the codebase
- **TypeScript Enhancements**: Replaced explicit 'any' types with proper type definitions
- **React Hooks Optimization**: Fixed dependency warnings in useEffect hooks
- **Code Cleanup**: Removed unused variables and imports for better maintainability
- **Performance Improvements**: Optimized component re-renders and API calls

### Previous Updates (v0.5.0)

### Enhanced Username Validations
- **Comprehensive Validation Rules**: Implemented robust username validation across all user-facing forms
- **Length Restrictions**: Usernames must be 3-20 characters long
- **Character Validation**: Only letters, numbers, dots, underscores, and hyphens allowed
- **Format Rules**: No leading/trailing/consecutive special characters
- **Reserved Words Blocking**: Prevents use of common system words (admin, root, system, etc.)
- **Case-Insensitive Uniqueness**: Usernames are unique within organizations regardless of case
- **Real-time Validation**: Immediate feedback as users type with clear error messages
- **Multi-language Support**: Validation messages available in English, Hindi, and Gujarati
- **Consistent Implementation**: Applied to UserManager, Register, and UserProfileForm components

### Previous Updates (v0.4.0)

### Enhanced Pagination System
- **Dynamic Items Per Page**: Added dropdown selector allowing users to choose 25, 50, or 100 items per page (default: 25)
- **Always Visible Controls**: Pagination controls now remain visible even when there's only one page of data
- **Consistent UX**: Items per page selector and page information always accessible across all data tables
- **Improved Performance**: Better handling of large datasets with user-controlled pagination limits

### Previous Updates (v0.3.0)

### Stock Management System
- **New Stock Page**: Dedicated stock management interface with separate rows for each product variant
- **Advanced Filtering**: Filter by product name, category, design, color, quality, and packaging type
- **Zero Stock Toggle**: Option to show/hide products with zero inventory
- **Pagination**: Efficient handling of large inventories with 50 items per page
- **Mobile Accordions**: Collapsible interface optimized for mobile devices
- **Enhanced Stock Badges**: Large, color-coded quantity indicators (32px+ height)
- **Real-time Updates**: Stock levels automatically updated when production is logged

### Database Architecture
- **New `inventory_summary` Table**: Optimized for fast stock queries with product variant tracking
- **Automated UPSERT Operations**: Real-time stock updates when inventory logs are created
- **Data Migration**: Seamless migration from existing inventory logs to new summary structure

## Previous Updates (v0.2.0)

### Toast Message System Refactor
- Implemented a comprehensive localized toast message system
- Eliminated hardcoded translations in the generic useCrud hook
- Each component now provides its own contextually appropriate messages
- Full support for English, Hindi, and Gujarati languages

### Button Color Scheme Implementation
- Fixed theme configuration that was preventing proper colorScheme functionality
- Implemented consistent color coding across all components:
  - **Red**: Destructive actions (delete, archive, logout)
  - **Green**: Positive actions (save, reactivate)
  - **Blue**: Primary actions (login, add, update)
  - **Default**: Neutral actions (edit, cancel)

### Security & Performance
- Fixed SQL injection vulnerability in distinct value endpoints
- Implemented proper input validation with Zod schemas
- Added comprehensive error monitoring with Sentry
- Optimized for serverless deployment on Vercel

### Login Security Enhancements (v0.2.0)
- Added user-specific login attempt tracking using IP+username composite keys
- Implemented remaining login attempts display for better user feedback
- Added structured error codes (RATE_LIMIT_EXCEEDED, ACCOUNT_INACTIVE, INVALID_CREDENTIALS)
- Enhanced rate limiter to return structured error data with localized messages
- Improved security with better error handling and user feedback

## CI/CD

The project includes a GitHub Actions workflow that performs:
*   **Linting:** Code style enforcement
*   **Testing:** Unit and integration tests
*   **Security Scanning:** Vulnerability detection
*   **Type Checking:** TypeScript validation

## Contributing

The application uses a Memory Bank system (`.kilocode/rules/memory-bank/`) to maintain project knowledge and context for developers. Please review the memory bank files before making significant changes.
