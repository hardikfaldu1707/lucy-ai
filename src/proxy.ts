import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth/admin-role";

// Only the authenticated app areas require a session. The marketing/landing
// surface (home, explore, generate, create, public chat, pricing, etc.) and
// Clerk's own sign-in/sign-up routes stay public.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { isAuthenticated, userId, sessionClaims } = await auth();

  // Only bounce signed-in users away from /sign-in when the session is valid.
  // A stale cookie (userId without isAuthenticated) causes refresh loops if we redirect here.
  if (isAuthenticated && isAuthRoute(request)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Admin routes: Clerk publicMetadata.role === "admin" or profiles.is_admin in Supabase.
  if (isAdminRoute(request)) {
    const admin = await isAdminUser(userId, sessionClaims);
    if (!admin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
