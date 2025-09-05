# FlowDash Changelog

All notable changes to FlowDash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.3] - 2025-09-05

### Added
- **Bulk Import Image Optimization**: Implemented Sharp-based image optimization with automatic resizing (500x500px) and WebP conversion for 60-80% file size reduction
- **Hash-Based Duplicate Detection**: Added SHA-256 content hashing to prevent storage waste from identical images across bulk import, media library, and single uploads
- **Parallel Processing**: Implemented controlled parallel image processing (3 concurrent uploads) for 3x faster bulk imports on Vercel free plan
- **Smart Filename Handling**: Base filenames stored in database, Vercel Blob handles uniqueness with random suffixes
- **Comprehensive Error Handling**: 30-second timeouts, graceful failure recovery, and detailed logging for robust operation
- **Database Schema Enhancement**: Added content_hash column with performance index for efficient duplicate detection
- **Cross-Platform Consistency**: Unified image processing logic across bulk import, media library, and single product uploads

## [0.6.2] - 2025-09-05

### Added
- **Media Management UI/UX Enhancements**: Streamlined upload flow, improved deletion experience with Chakra UI AlertDialogs, enhanced error handling, and translation system updates
- **Upload Progress Feedback**: Visual indicators and loading states for better user experience
- **Automatic Media Library Refresh**: No page reload needed after operations
- **Code Quality Improvements**: Removed debug messages, optimized event handling, and ensured clean maintainable codebase

### Fixed
- React key warnings in ImageSelector component
- Translation message templates across all supported languages

## [0.6.1] - 2025-09-03

### Added
- **Smart CSV Import**: Enhanced product import with intelligent image_url support and automatic media library integration
- **Image Preview Optimization**: Fixed image loading in edit mode, eliminated unnecessary API calls
- **Database Integrity**: Resolved media_id column errors and optimized product-media relationship handling

### Fixed
- Archived products visibility in media library linked products list
- ESLint warnings and unused imports cleanup
- React hooks dependency optimization

## [0.6.0] - 2025-09-03

### Added
- **Complete Media Library System**: Comprehensive centralized image management with WordPress-style interface
- **Drag-and-Drop Upload**: Inline expandable upload area with visual feedback
- **Bulk Operations**: WordPress-style bulk select, bulk delete, and bulk actions
- **Advanced Search**: Debounced search (500ms delay) with real-time filtering
- **Image Optimization**: Automatic processing with Sharp (resize, WebP conversion, quality optimization)
- **Responsive Design**: Mobile-first design with custom breakpoints (2-12 columns)
- **Navigation Integration**: New Media submenu with Library and Upload Media options
- **Modal Viewer**: Two-column layout with navigation arrows and file details
- **Database Architecture**: New media tables with organization isolation and foreign key relationships
- **Multi-language Support**: Complete internationalization for English, Hindi, and Gujarati
- **Security**: Role-based access control (admin/super-admin only)

## [0.5.3] - 2025-09-03

### Fixed
- **Critical Pagination Bugs**: Resolved duplicate records appearing across different pages in product management
- **Deterministic Ordering**: Added secondary sort keys (id DESC) to all paginated queries
- **API Consistency**: Standardized all pagination APIs to use page-based parameters
- **Type Safety**: Replaced explicit 'any' types with proper TypeScript interfaces

## [0.5.2] - 2025-09-03

### Added
- **Enhanced Product Search & Pagination**: Multi-field search across product name, category, design, and color fields
- **Debounced Search**: 500ms delay to prevent server overload
- **Improved Pagination**: Consistent behavior across all endpoints

### Fixed
- **ESLint Compliance**: Fixed all warnings and errors across the codebase
- **TypeScript Enhancements**: Replaced 'any' types with proper type definitions
- **React Hooks Optimization**: Fixed dependency warnings in useEffect hooks
- **Code Cleanup**: Removed unused variables and imports

## [0.5.1] - 2025-09-03

### Fixed
- **Product Image Display**: Changed `objectFit` from "cover" to "contain" to ensure complete image visibility without cropping
- **Image Components**: Updated 9 Image components across ProductTable, ProductSelector, StockManager, and ProductFormModal

## [0.5.0] - 2025-09-03

### Added
- **Enhanced Username Validations**: Comprehensive validation rules across all user-facing forms
- **Length Restrictions**: Usernames must be 3-20 characters long
- **Character Validation**: Only letters, numbers, dots, underscores, and hyphens allowed
- **Format Rules**: No leading/trailing/consecutive special characters
- **Reserved Words Blocking**: Prevents use of common system words
- **Case-Insensitive Uniqueness**: Usernames unique within organizations regardless of case
- **Multi-language Support**: Validation messages in English, Hindi, and Gujarati

## [0.4.1] - 2025-09-03

### Fixed
- **Production Log Search Bar**: Enhanced search functionality to include design and color fields for floor staff

## [0.4.0] - 2025-09-03

### Added
- **Dynamic Items Per Page**: Dropdown selector allowing users to choose 25, 50, or 100 items per page
- **Always Visible Pagination Controls**: Pagination controls remain visible even with single page
- **Consistent UX**: Items per page selector accessible across all data tables
- **Improved Performance**: Better handling of large datasets

## [0.3.0] - 2025-09-03

### Added
- **Stock Management System**: Comprehensive finished goods inventory tracking
- **Advanced Filtering**: Filter by product name, category, design, color, quality, and packaging type
- **Zero Stock Toggle**: Option to show/hide products with zero inventory
- **Mobile Accordions**: Collapsible interface optimized for mobile devices
- **Enhanced Stock Badges**: Large, color-coded quantity indicators
- **Database Architecture**: New `inventory_summary` table with automated UPSERT operations

## [0.2.1] - 2025-09-03

### Fixed
- **Login Error Notices**: Resolved inconsistency between local and Vercel deployment for error message display

## [0.2.0] - 2025-09-03

### Added
- **Toast Message System Refactor**: Comprehensive localized toast message system
- **Button Color Scheme Implementation**: Consistent color coding for actions (red/green/blue)
- **Login Security Enhancements**: User-specific login attempt tracking and rate limiting

### Fixed
- **SQL Injection Prevention**: Proper input validation with Zod schemas
- **Error Monitoring**: Comprehensive error handling with Sentry

## [0.1.0] - 2025-09-03

### Added
- Initial release of FlowDash inventory management system
- Role-based access control (super_admin, admin, floor_staff)
- Basic product management and inventory logging
- User management and authentication
- Multi-language support (English, Hindi, Gujarati)