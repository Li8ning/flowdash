# AI Development Rules for FlowDash Project

## 🔒 **SECURITY RULES (NON-NEGOTIABLE)**

### Rule #1: Never Compromise Security
- **NEVER** store sensitive data in localStorage/sessionStorage
- **ALWAYS** validate inputs using Zod schemas before processing
- **ALWAYS** use parameterized queries - never string concatenation for SQL
- **ALWAYS** implement proper authentication checks in API routes
- **NEVER** expose internal system details in error messages to users
- **ALWAYS** sanitize user inputs, especially file uploads and search queries

### Rule #2: JWT & Authentication Standards
```typescript
// ✅ CORRECT - Always verify JWT in protected routes
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of logic
}

// ❌ WRONG - Never skip authentication
export async function GET(request: NextRequest) {
  // Direct database access without auth check
}
```

### Rule #3: Role-Based Access Control
- **ALWAYS** check user roles before allowing actions
- **NEVER** trust frontend role checks - always verify on backend
- **ENFORCE** the hierarchy: `super_admin > admin > floor_staff`

```typescript
// ✅ CORRECT
if (user.role !== 'admin' && user.role !== 'super_admin') {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}

// ❌ WRONG - Client-side only check
if (user.role === 'admin') { /* show admin UI */ }
```

---

## 🏗️ **ARCHITECTURAL RULES**

### Rule #4: Follow Established Patterns
- **USE** the existing folder structure in `src/`
- **MAINTAIN** the Context API pattern for global state
- **FOLLOW** the API response format: `{ success: boolean, data?: T, error?: string }`
- **USE** existing utility functions instead of creating duplicates

### Rule #5: Component Organization
```typescript
// ✅ CORRECT - Follow the component structure
src/components/
├── auth/           // Authentication related
├── dashboard/      // Dashboard components  
├── inventory/      // Inventory management
├── products/       // Product management
├── shared/         // Reusable components
└── ui/            // Base UI components
```

### Rule #6: API Route Standards
- **ALWAYS** use proper HTTP methods (GET, POST, PATCH, PUT, DELETE)
- **IMPLEMENT** consistent error handling using `handleApiError()`
- **RETURN** standardized API responses
- **VALIDATE** request bodies with Zod schemas

```typescript
// ✅ CORRECT API Route Pattern
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);
    
    const result = await createProduct(validatedData, user.organizationId);
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 📝 **CODE QUALITY RULES**

### Rule #7: TypeScript Strictness
- **NEVER** use `any` type - always define proper interfaces
- **USE** strict mode - no implicit returns, proper null checks
- **DEFINE** interfaces for all data structures
- **USE** generic types where appropriate

```typescript
// ✅ CORRECT
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface User {
  id: string;
  username: string;
  role: 'super_admin' | 'admin' | 'floor_staff';
  organizationId: string;
}

// ❌ WRONG
function processUser(user: any): any {
  return user.someProperty;
}
```

### Rule #8: Error Handling Standards
- **ALWAYS** wrap async operations in try-catch blocks
- **USE** custom error classes for different error types
- **LOG** errors with proper context using Pino logger
- **NEVER** expose stack traces to end users

```typescript
// ✅ CORRECT Error Handling
try {
  const result = await databaseOperation();
  return result;
} catch (error) {
  logger.error({ 
    operation: 'databaseOperation', 
    userId: user.id,
    error: error.message 
  }, 'Database operation failed');
  
  throw new DatabaseError('Failed to process request');
}
```

### Rule #9: Performance Considerations
- **ALWAYS** implement pagination for list endpoints
- **USE** React.memo() for expensive components
- **IMPLEMENT** debouncing for search inputs
- **OPTIMIZE** database queries with proper indexes
- **AVOID** N+1 query problems

---

## 🎨 **UI/UX RULES**

### Rule #10: Chakra UI Consistency
- **USE** Chakra UI components exclusively - no custom CSS
- **FOLLOW** the existing design system and color schemes
- **MAINTAIN** consistent spacing using Chakra's spacing scale
- **ENSURE** accessibility with proper ARIA labels

### Rule #11: Internationalization (i18n)
- **ALWAYS** use `useTranslation()` hook for all user-facing text
- **NEVER** hardcode strings in components
- **SUPPORT** English, Hindi, and Gujarati languages
- **TEST** text overflow in different languages

```typescript
// ✅ CORRECT
const { t } = useTranslation();
return <Button>{t('common.save')}</Button>;

// ❌ WRONG
return <Button>Save</Button>;
```

### Rule #12: Loading States & UX
- **ALWAYS** show loading states for async operations
- **USE** the global `LoadingContext` for page-level loading
- **PROVIDE** meaningful error messages to users
- **IMPLEMENT** optimistic updates where appropriate

---

## 🧪 **TESTING RULES**

### Rule #13: Test Coverage Requirements
- **WRITE** unit tests for all service functions
- **TEST** API endpoints with different auth scenarios
- **MOCK** external dependencies (database, file storage)
- **MAINTAIN** at least 80% code coverage

### Rule #14: Test Structure
```typescript
// ✅ CORRECT Test Structure
describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create product successfully with valid data', async () => {
      // Arrange
      const productData = { name: 'Test Product', sku: 'TEST-001' };
      
      // Act
      const result = await productService.createProduct(productData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Product');
    });

    it('should throw ValidationError with invalid data', async () => {
      const invalidData = { name: '', sku: '' };
      
      await expect(productService.createProduct(invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

---

## 📊 **DATABASE RULES**

### Rule #15: Database Best Practices
- **ALWAYS** use transactions for multi-table operations
- **IMPLEMENT** proper error handling for database operations
- **USE** connection pooling efficiently
- **NEVER** perform database operations in loops - use batch operations

```typescript
// ✅ CORRECT - Batch operation
const client = await db.getClient();
try {
  await client.query('BEGIN');
  
  const results = await Promise.all(
    products.map(product => 
      client.query('INSERT INTO products (name, sku) VALUES ($1, $2)', [product.name, product.sku])
    )
  );
  
  await client.query('COMMIT');
  return results;
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Rule #16: Migration Standards
- **VERSION** all database changes
- **WRITE** both up and down migration scripts
- **TEST** migrations on sample data
- **DOCUMENT** breaking changes

---

## 🚀 **DEPLOYMENT & MAINTENANCE RULES**

### Rule #17: Environment Management
- **VALIDATE** all environment variables at startup
- **USE** different configs for dev/staging/production
- **NEVER** commit secrets to version control
- **IMPLEMENT** proper logging levels by environment

### Rule #18: Monitoring & Observability
- **LOG** all significant operations with structured data
- **MONITOR** API response times and error rates
- **IMPLEMENT** health check endpoints
- **TRACK** user actions for audit purposes

```typescript
// ✅ CORRECT Logging
logger.info({
  userId: user.id,
  action: 'product_created',
  productId: result.id,
  organizationId: user.organizationId,
  timestamp: new Date().toISOString()
}, 'Product created successfully');
```

---

## 🔄 **DEVELOPMENT WORKFLOW RULES**

### Rule #19: Code Review Standards
- **WRITE** clear, descriptive commit messages
- **CREATE** focused pull requests (single feature/fix)
- **INCLUDE** tests with new features
- **UPDATE** documentation for API changes

### Rule #20: Backward Compatibility
- **MAINTAIN** API compatibility when possible
- **VERSION** breaking changes properly
- **PROVIDE** migration paths for data changes
- **DEPRECATE** features before removing them

---

## ⚡ **PERFORMANCE RULES**

### Rule #21: Frontend Performance
- **LAZY LOAD** components and routes
- **MINIMIZE** bundle size with tree shaking
- **OPTIMIZE** images and assets
- **IMPLEMENT** proper caching strategies

### Rule #22: Backend Performance
- **USE** database indexes effectively
- **IMPLEMENT** query optimization
- **CACHE** frequently accessed data
- **MONITOR** and optimize slow queries

---

## 🎯 **AI-SPECIFIC GUIDELINES**

### Rule #23: Context Awareness
- **UNDERSTAND** the existing codebase before making changes
- **FOLLOW** established naming conventions
- **RESPECT** the current architecture decisions
- **ASK** for clarification when requirements are unclear

### Rule #24: Incremental Development
- **MAKE** small, focused changes
- **TEST** each change thoroughly
- **DOCUMENT** complex logic and decisions
- **CONSIDER** the impact on existing functionality

### Rule #25: Code Generation Standards
- **GENERATE** complete, working code - no placeholders
- **INCLUDE** proper error handling and validation
- **ADD** relevant comments for complex logic
- **ENSURE** code follows project conventions

---

## 🚨 **CRITICAL REMINDERS**

1. **Security is paramount** - When in doubt, choose the more secure option
2. **User experience matters** - Always consider the end user's perspective
3. **Maintainability is key** - Write code that others can understand and modify
4. **Performance impacts scalability** - Consider performance implications of all changes
5. **Documentation saves time** - Document complex logic and architectural decisions

These rules ensure consistent, secure, and maintainable code development for the FlowDash project. Follow them religiously to maintain code quality and project integrity.