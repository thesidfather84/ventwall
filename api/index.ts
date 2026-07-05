/**
 * Vercel Serverless Function — routes all /api/* traffic to the Express app.
 *
 * vercel.json rewrites "/api/:path*" → this handler, so the Express router
 * receives the full original URL (e.g. /api/posts) and routes it normally.
 *
 * @vercel/node compiles this TypeScript file and resolves workspace packages
 * via the pnpm install that Vercel runs before the build step.
 */
import app from "../artifacts/api-server/src/app.js";

export default app;
