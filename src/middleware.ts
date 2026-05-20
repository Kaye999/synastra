import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/chart(.*)',
  '/settings(.*)',
  '/api/chat(.*)',
]);

// /chart is always auth-gated now (demo flow removed 2026-05-20 — free
// users go through /onboarding and read their own Western + Numerology).
// /api/profile handles its own Clerk auth check.
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Run on everything except Next.js internals and static files. Always run on API routes.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};
