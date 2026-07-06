/**
 * Vercel Serverless Function — routes all /api/* traffic to the Express app.
 *
 * vercel.json rewrites "/api/:path*" → this handler, so the Express router
 * receives the full original URL (e.g. /api/posts) and routes it normally.
 *
 * @vercel/node transpiles each TypeScript file it can reach individually and
 * lets Node's real (strict) ESM resolver link them at runtime — it does not
 * bundle the workspace packages (@workspace/db, @workspace/api-zod), which
 * ship untranspiled .ts source and can't be resolved that way. The
 * `build:vercel` script (run from vercel.json's buildCommand) pre-bundles
 * the whole Express app with esbuild into this single generated file, so
 * there are no cross-package workspace imports left for Node to resolve.
 */
import app from "./_generated/app.mjs";

export default app;
