import * as Sentry from "@sentry/nextjs";

Sentry.init({
 dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
 // Keep client overhead low for PSI (INP/main-thread)
 tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.1,
 replaysSessionSampleRate: 0,
 replaysOnErrorSampleRate: 0.05,
 enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
