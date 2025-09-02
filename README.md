# FlowDash - Inventory Management System

**Version: 0.5.0**

FlowDash is a web-based inventory management system designed specifically for small to medium-sized factories, particularly in the Indian market. It provides a simple, user-friendly platform for factory owners and floor staff to track production, manage inventory, and gain insights into their operations.

## Key Features

*   **Role-Based Access Control (RBAC):** Three-tiered role system with `super_admin` (full control), `admin` (manages floor staff and products), and `floor_staff` (limited to their own logs).
*   **Product Management:** Create, update, and manage products with attributes like color, design, quality, and packaging types. Includes bulk CSV import and image upload capabilities.
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

## Recent Updates (v0.5.0)

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
