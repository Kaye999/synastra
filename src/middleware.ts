import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/chart(.*)',
  '/settings(.*)',
  '/api/chat(.*)',
]);

// /chart?demo=1 must remain public (no auth) — it's the anonymous demo.
// /api/ayurveda, /api/enneagram, /api/profile handle their own Clerk auth.
export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const isDemo = url.pathname.startsWith('/chart') && url.searchParams.get('demo') === '1';
  if (isDemo) return;
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
