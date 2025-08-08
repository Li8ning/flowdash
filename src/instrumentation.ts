import * as Sentry from "@sentry/nextjs";

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}

export function onRequestError({ error }: { error: unknown }) {
  Sentry.captureException(error);
}