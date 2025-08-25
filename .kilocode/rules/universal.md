## Project-Specific Tech Stack Rules

### Next.js 14+ (App Router)
- Use App Router directory structure (`app/` folder)
- Implement Server Components by default, use Client Components only when necessary (`'use client'`)
- Utilize route groups `(group)` for organization without affecting URL structure
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` files for proper UX
- Implement proper metadata API for SEO optimization
- Use `generateStaticParams` for dynamic routes that can be pre-rendered
- Leverage streaming with Suspense boundaries for better perceived performance

### TypeScript Best Practices
- Enable strict mode in `tsconfig.json`
- Use proper type annotations and avoid `any` type
- Create custom types and interfaces in dedicated `types/` directory
- Use generic types for reusable components and functions
- Implement proper return types for all functions
- Use type guards for runtime type checking
- Leverage TypeScript's utility types (Pick, Omit, Partial, etc.)

### Database (Vercel Postgres)
- Use connection pooling with `@vercel/postgres`
- Implement proper database migrations strategy
- Use parameterized queries to prevent SQL injection
- Create database utility functions in `lib/db.ts`
- Implement proper error handling for database operations
- Use transactions for multi-table operations
- Consider implementing database connection retry logic

### Chakra UI Implementation
- Use Chakra's theme system for consistent design
- Create custom theme configuration in `theme/` directory
- Implement responsive design using Chakra's responsive props
- Use Chakra's built-in accessibility features
- Create reusable component compositions
- Leverage Chakra's color mode (dark/light theme) capabilities
- Use Chakra's form components with proper validation integration

### JWT Authentication with Jose
- Store JWT tokens securely (httpOnly cookies recommended)
- Implement proper token refresh mechanism
- Use middleware for route protection
- Validate JWT tokens on server-side for protected routes
- Implement proper logout functionality that invalidates tokens
- Use proper JWT claims and avoid sensitive data in payload
- Set appropriate token expiration times

### Zod Schema Validation
- Create schema definitions in `schemas/` directory
- Use Zod for both client-side and server-side validation
- Implement proper error messages for validation failures
- Use Zod's `transform` and `refine` methods for complex validations
- Create reusable validation schemas for common patterns
- Integrate Zod with form libraries for seamless validation
- Use Zod's `safeParse` method for error handling

### File Storage (Vercel Blob)
- Implement proper file upload validation (size, type, etc.)
- Use unique file naming to prevent conflicts
- Implement proper error handling for upload failures
- Consider implementing upload progress indicators
- Use proper MIME type validation
- Implement file cleanup for failed operations
- Consider implementing file versioning if needed

### Image Processing (Sharp)
- Implement image compression before upload
- Generate multiple image sizes for responsive images
- Use proper image formats (WebP, AVIF) for modern browsers
- Implement proper error handling for image processing
- Consider implementing background processing for large images
- Use Sharp's pipeline for efficient memory usage
- Implement proper image metadata handling

## Code Organization & Structure

### Directory Structure
```
app/
├── (auth)/
├── (dashboard)/
├── api/
├── globals.css
└── layout.tsx
components/
├── ui/
├── forms/
└── layout/
lib/
├── auth.ts
├── db.ts
├── validations.ts
└── utils.ts
types/
├── auth.ts
├── database.ts
└── api.ts
schemas/
├── user.ts
├── auth.ts
└── common.ts
```

### Component Guidelines
- Use functional components with proper TypeScript interfaces
- Implement proper prop validation with TypeScript
- Use Server Components for data fetching when possible
- Create small, focused components with single responsibilities
- Use proper naming conventions (PascalCase for components)
- Implement proper error boundaries for client components
- Use React.memo() judiciously for performance optimization

## Security Implementation

### Authentication Security
- Implement CSRF protection for state-changing operations
- Use secure cookie settings (httpOnly, secure, sameSite)
- Implement proper session management
- Add rate limiting to authentication endpoints
- Use bcrypt or similar for password hashing
- Implement account lockout after failed attempts

### API Route Security
- Validate all inputs using Zod schemas
- Implement proper authorization checks
- Use CORS properly for cross-origin requests
- Sanitize data before database operations
- Implement proper error responses without leaking information
- Use HTTPS in production environment

### File Upload Security
- Validate file types on both client and server
- Implement file size limits
- Scan uploaded files for malware (consider third-party services)
- Use secure file naming conventions
- Implement proper access controls for uploaded files

## Performance Optimization

### Next.js Optimizations
- Use `Image` component for optimized image loading
- Implement proper caching strategies with `revalidate`
- Use dynamic imports for code splitting
- Implement proper bundle analysis
- Use `loading.tsx` and Suspense for better UX
- Optimize fonts using `next/font`

### Database Performance
- Implement proper database indexing
- Use connection pooling efficiently
- Implement query optimization
- Consider implementing database query caching
- Use pagination for large datasets
- Monitor database performance metrics

### Client-Side Performance
- Minimize JavaScript bundle size
- Use React.lazy() for component-level code splitting
- Implement proper state management to avoid unnecessary re-renders
- Use Chakra UI's built-in performance optimizations
- Implement proper image lazy loading

## Testing Strategy

### Jest Configuration
- Configure Jest with Next.js testing environment
- Use proper test file naming conventions (`*.test.ts`, `*.spec.ts`)
- Implement setup files for test configuration
- Mock external dependencies properly
- Use proper test data factories

### React Testing Library
- Test component behavior, not implementation details
- Use proper queries (getByRole, getByLabelText, etc.)
- Implement integration tests for user workflows
- Test accessibility features
- Use proper async testing patterns
- Mock API calls appropriately

### Test Coverage
- Aim for 80%+ code coverage
- Focus on critical business logic
- Test error scenarios and edge cases
- Implement E2E tests for critical user journeys
- Test authentication and authorization flows

## Deployment & CI/CD

### GitHub Actions Workflow
```yaml
# Example workflow structure
- Test (lint, type-check, unit tests)
- Build (Next.js build)
- Security scan
- Deploy to Vercel
- Post-deployment tests
```

### Environment Management
- Use proper environment variable naming
- Implement different configs for dev/staging/prod
- Never commit sensitive environment variables
- Use Vercel's environment variable management
- Implement proper secret rotation strategies

### Production Deployment
- Enable all Next.js production optimizations
- Configure proper CSP headers
- Implement proper logging and monitoring
- Set up error tracking (Sentry, etc.)
- Configure proper backup strategies
- Implement health check endpoints

## Error Handling & Monitoring

### Error Boundaries
- Implement error boundaries for client components
- Create user-friendly error pages
- Log errors properly without exposing sensitive data
- Implement proper fallback UI for errors

### API Error Handling
- Use consistent error response format
- Implement proper HTTP status codes
- Log errors with proper context
- Implement retry logic for transient errors
- Use proper error monitoring tools

### Monitoring & Logging
- Implement structured logging
- Monitor application performance metrics
- Set up alerts for critical errors
- Track user behavior and conversion metrics
- Monitor database performance
- Implement proper log retention policies

## Development Workflow

### Code Quality
- Use ESLint with Next.js and TypeScript rules
- Implement Prettier for code formatting
- Use Husky for pre-commit hooks
- Implement proper commit message conventions
- Use TypeScript strict mode
- Regular dependency updates and security audits

### Documentation
- Maintain up-to-date README with setup instructions
- Document API endpoints with proper examples
- Create component documentation with Storybook (optional)
- Document deployment processes
- Maintain changelog for releases