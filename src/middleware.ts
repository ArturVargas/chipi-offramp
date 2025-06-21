import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/onboarding"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  // const { userId, sessionClaims, redirectToSignIn } = await auth();

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // TEMPORARILY DISABLED: If the user is signed in, but has not completed onboarding, redirect them.
  // if (
  //   userId &&
  //   (!sessionClaims?.metadata?.StellarWalletCreated) &&
  //   req.nextUrl.pathname !== "/onboarding"
  // ) {
  //   const onboardingUrl = new URL("/onboarding", req.url);
  //   return NextResponse.redirect(onboardingUrl);
  // }

  // Allow users to pass through if they are authenticated and onboarded.
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};