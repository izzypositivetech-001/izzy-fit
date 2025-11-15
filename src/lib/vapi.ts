import Vapi from "@vapi-ai/web";

// Initialize Vapi only when the environment variable is available
// Using a factory function ensures it's not evaluated at build time
export const getVapi = () => {
  const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_VAPI_API_KEY is not set");
    return null;
  }
  return new Vapi(apiKey);
};

// For backward compatibility, create a lazy-loaded instance
export let vapi: Vapi | null = null;

if (typeof window !== "undefined") {
  vapi = getVapi();
}