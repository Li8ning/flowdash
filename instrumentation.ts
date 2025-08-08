// This file configures the Sentry browser client.

import * as Sentry from "@sentry/nextjs";

export function register() {
  // This ensures that the Sentry client is only initialized in the browser.
  if (process.env.NEXT_RUNTIME === "browser") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      replaysOnErrorSampleRate: 1.0,

      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: process.env.NODE_ENV === 'development' ? 0.1 : 0.01,


      // You can remove this option if you're not planning to use the Sentry Session Replay feature:
      integrations: [
        Sentry.replayIntegration({
          // Additional Replay configuration goes in here, for example:
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  }
}