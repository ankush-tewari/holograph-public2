# Holograph App Project Summary

## Overview
The Holograph app is a Next.js application that enables users to create and share holographs with fine-grained access control. The app uses a principle/delegate model for permissions.

## Architecture

### Data Model
- Users: Base entity for authentication and identification
- Holographs: Main content entity
- HolographPrincipals: Manages ownership (many-to-many relationship between Users and Holographs)
- HolographDelegates: Manages viewing permissions (many-to-many relationship for delegated access)

### Permission Model
- Principals (owners) have full control over their Holographs
- Delegates have view-only access to specific Holographs
- Users can be both Principals and Delegates across different Holographs

### Technical Stack
- Frontend: Next.js with App Router
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT-based auth system
- API: Next.js API routes
- Styling: Tailwind CSS
- Icons: Lucide React

## Component Structure

### Dashboard (src/app/dashboard/page.tsx)
- Main entry point with authentication
- Displays user information
- Integrates HolographDashboard component

### HolographDashboard (src/app/components/HolographDashboard.tsx)
- Displays owned and delegated holographs
- Provides interface for creating new holographs
- Features:
  - Tab navigation between owned/delegated holographs
  - Create new holograph modal
  - Last modified dates
  - Share functionality (to be implemented)

### CreateHolograph (src/app/components/holograph/CreateHolograph.tsx)
- Form for creating new holographs
- Handles:
  - Title and content input
  - API submission
  - Loading states
  - Error handling
- Posts to /api/holograph/create endpoint

### ManageHolographAccess (src/app/components/holograph/ManageHolographAccess.tsx)
- Manages holograph access permissions
- Functionality for adding/removing principals and delegates

## API Endpoints
- /api/holograph/create: Create new holographs
- /api/holograph/principals: Manage principal access
- /api/holograph/delegates: Manage delegate access
- /api/auth/*: Authentication endpoints
- /api/auth/user: Get current user information

## Current Implementation Status
- ✅ Basic authentication flow
- ✅ Dashboard layout
- ✅ Holograph creation
- ✅ View segregation (owned vs delegated)
- 🔄 Share functionality (in progress)
- 🔄 Access management (in progress)

## Important Implementation Details
- User authentication is required to access the dashboard
- JWT tokens used for API authentication
- Tailwind used for responsive design
- Modal-based creation flow
- Real-time error handling and loading states

## Future Enhancements
- Implement share functionality
- Add real-time updates
- Enhance error handling
- Add search and filtering
- Implement sorting options
- Add pagination for large lists
- Enhance mobile responsiveness

## Notes for Development
- All components use TypeScript for type safety
- Error boundaries should be implemented
- API responses should be properly typed
- Keep accessibility in mind when adding new features
- Document new endpoints as they're added
- Test authentication edge cases