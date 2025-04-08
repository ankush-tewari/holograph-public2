// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

// Protect all routes that should require authentication
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/holographs/:path*",
    // Add any other protected routes
  ],
};