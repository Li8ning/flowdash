# FlowDash - Technical Stack

## 💻 **Technologies Used**
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: Chakra UI
- **Database**: Vercel Postgres
- **File Storage**: Vercel Blob
- **Authentication**: JWT with Jose
- **Validation**: Zod
- **API**: Next.js API Routes (Serverless Functions)
- **Image Processing**: Sharp
- **Testing**: Jest, React Testing Library
- **Error Monitoring**: Sentry
- **Logging**: Pino
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## 🚀 **Development Setup**
1. **Prerequisites**: Node.js (v18+), npm/yarn/pnpm
2. **Installation**: `npm install`
3. **Environment Variables**: Create a `.env.local` file and add the necessary environment variables (e.g., database connection string, JWT secret).
4. **Database Setup**: Run the SQL migration files in the `src/lib/migrations` directory to set up the database schema.
5. **Running the Development Server**: `npm run dev`

## ⚙️ **Technical Constraints**
- **Serverless Environment**: The application is designed to be deployed on a serverless platform (Vercel), which has implications for long-running processes and connection management.
- **Stateless API**: The API is stateless, with user authentication managed through JWTs.
- **Third-party Services**: The application relies on Vercel for hosting, database, and file storage.

## 📦 **Dependencies**
- **`@chakra-ui/react`**: UI component library.
- **`@vercel/postgres`**: Adapter for Vercel Postgres.
- **`@vercel/blob`**: Adapter for Vercel Blob storage.
- **`jose`**: For JWT signing and verification.
- **`zod`**: For data validation.
- **`i18next`**, **`react-i18next`**: For internationalization.
- **`jest`**: For testing.