"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

// Initialize ConvexReactClient with environment variable
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Create a valid ConvexReactClient instance - use a placeholder during build if needed
const convex = new ConvexReactClient(
  convexUrl || "https://placeholder.convex.cloud"
);

function ConvexClerkProvider({ children } : { children: React.ReactNode }) {
  // Use a fallback key if not available (won't actually work at runtime, but allows build to complete)
  const publishableKey = clerkPublishableKey || "pk_test_placeholder";

  // Validate that required environment variables are set
  if (!clerkPublishableKey) {
    console.warn("⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication will not work.");
  }
  if (!convexUrl) {
    console.warn("⚠️ NEXT_PUBLIC_CONVEX_URL is not set. Convex database will not work.");
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk 
        client={convex} 
        useAuth={useAuth}
      >
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default ConvexClerkProvider;