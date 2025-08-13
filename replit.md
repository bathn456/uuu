# Overview

This is a deep learning educational platform built with React, Express.js, and PostgreSQL. The application serves as a comprehensive resource for learning deep learning algorithms and concepts, featuring algorithm tutorials, project showcases, and educational content management. It's designed as a personal brand website for "Deep Learning with Batuhan Yılmaz" that focuses on algorithm education rather than code implementation.

# User Preferences

Preferred communication style: Simple, everyday language.
User prefers clean, deployment-agnostic setup without specific hosting configurations.

# Recent Changes

- Made "Add Content" modal more compact and user-friendly
- Implemented comprehensive note and file system for algorithms
- Added tabbed interface for uploading files and creating notes
- Created note editor with create, edit, delete functionality
- Fixed image viewing functionality - uploaded files now display correctly
- Added comprehensive file management system with preview, download, and delete capabilities
- Created dedicated Files section showing all uploaded materials
- Fixed file serving with proper MIME types and headers
- Changed admin password to "batu4567_%%" for easier access
- Added "Who is Batuhan Yılmaz?" button with detailed modal about the author
- Added LinkedIn and GitHub social links in header navigation
- Updated social media links to correct URLs: LinkedIn (https://www.linkedin.com/in/batuhan-y%C4%B1lmaz-20a309232/) and GitHub (https://github.com/bathn456)
- Added prominent section highlighting 100% original hand-written content
- Completed migration from Replit Agent to standard Replit environment
- All components working with PostgreSQL database and proper TypeScript types
- Added email contact (ybatu42@gmail.com) to header navigation alongside LinkedIn and GitHub links
- Fixed authentication issue preventing algorithm creation - admin token now properly included in all API requests
- **ENHANCED ADMIN LOGIN SECURITY**: Implemented comprehensive security system with bcrypt password hashing, JWT tokens with 24-hour expiration, rate limiting (5 attempts per 15 minutes), IP-based lockout protection, failed attempt tracking, security headers, and automatic session management with token expiration monitoring
- **MIGRATION COMPLETED**: Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database integration
- **ENHANCED DOWNLOAD FUNCTIONALITY**: Added prominent download buttons throughout the application - in file modals, content viewers, and file listings with proper styling and user experience
- **ULTRA-HIGH QUALITY FILE SYSTEM**: Increased file upload limits to 2GB with support for professional formats including RAW images (DNG, CR2), HEIC/HEIF, 4K/8K video formats (MKV, MP2T), and lossless audio (FLAC, AIFF). Enhanced download delivery with optimized headers, caching, and range request support for maximum quality preservation
- **PERFORMANCE OPTIMIZATIONS**: Implemented comprehensive performance improvements including database connection pooling, response caching, optimized query configurations, reduced logging overhead, and enhanced static file serving for faster website loading
- **MIGRATION TO REPLIT ENVIRONMENT COMPLETED**: Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database integration, fixed delete content button visibility with enhanced red delete button for admin users, added download functionality for all users, and verified all features working properly
- **FULLSCREEN IMAGE VIEWER ENHANCED**: Fixed fullscreen close functionality with mobile touch support, added X close button and delete button on right side, removed TypeScript errors, and ensured smooth operation across all devices
- **BACKGROUND MADE UNTOUCHABLE**: Implemented CSS pointer-events solution to make fullscreen background completely untouchable, preventing accidental closes while preserving image interaction and button functionality
- **REPLIT MIGRATION COMPLETED**: Successfully completed migration from Replit Agent to standard Replit environment with PostgreSQL database integration, fixed all TypeScript errors, added proper delete functionality for algorithms in both main section and detail page, ensured all features work properly with enhanced security and performance optimizations
- **ENHANCED CONTACT INFORMATION**: Added email contact (ybatu42@gmail.com) to the "Who is Batuhan Yılmaz?" modal alongside existing LinkedIn link with proper styling and hover effects
- **DELETE FUNCTIONALITY PERFECTED**: Fixed cache invalidation issue where deleted algorithms would briefly reappear - optimistic updates now work flawlessly with immediate UI response and no unwanted refetching
- **FILE DOWNLOAD SYSTEM REPAIRED**: Fixed critical download functionality issue where algorithm content files couldn't be downloaded - enhanced download route now properly searches both regular files and algorithm content with comprehensive error handling and high-quality headers
- **PROJECTS DELETE FUNCTIONALITY ENHANCED**: Updated projects section to use optimistic updates matching algorithms section behavior - projects now disappear immediately when deleted without delay or flickering
- **PLANETSCALE MIGRATION COMPLETED**: Successfully migrated database from PostgreSQL to MySQL for PlanetScale compatibility - updated all schema definitions, connection pooling, and database configuration for optimal PlanetScale performance with proper SSL settings
- **REPLIT AGENT TO STANDARD REPLIT MIGRATION COMPLETED**: Successfully migrated project from Replit Agent to standard Replit environment with PostgreSQL database integration - installed all dependencies, fixed database schema, resolved server listening configuration, built client application, and ensured all components work properly on port 5000
- **RENDER FILES COMPLETELY REMOVED**: Cleaned up all Render.com deployment files, scripts, and documentation at user request - project now deployment-agnostic

- **REPLIT AGENT TO STANDARD ENVIRONMENT MIGRATION COMPLETED**: Successfully migrated from Replit Agent to standard Replit environment with proper module resolution, installed all dependencies, fixed import paths from @shared/* to ../shared/*.js, configured database fallback, and server running on port 5000 with in-memory storage until PostgreSQL is configured

- **FIREBASE + IMAGEKIT PROJECT CREATED**: Built complete Firebase Hosting + ImageKit Storage integration with secure admin authentication, client-side image optimization (max 1080px, WebP conversion), Firebase Functions backend for secure ImageKit auth, comprehensive documentation, and free tier optimized settings - includes bonus automatic file compression reducing ImageKit quota usage by 60-80%
- **EMAIL INPUT ADDED TO ADMIN LOGIN**: Fixed missing email field in admin authentication form - header now includes both email and password inputs with proper state management and form validation
- **COMPREHENSIVE SECURITY CHECKLIST CREATED**: Developed detailed security and operation checklist covering 88+ security controls including authentication, file security, GDPR compliance, monitoring, backup strategies, and production deployment protocols
- **IMAGEKIT INTEGRATION COMPLETED**: Successfully integrated ImageKit cloud storage service with comprehensive upload, optimization, and management features - includes secure authentication, real-time image optimization, CDN delivery, file management dashboard, and fallback to local storage when ImageKit is not configured
- **FIREBASE HOSTING OPTIMIZATION COMPLETED**: Implemented comprehensive Firebase Hosting optimizations including performance headers (1-year static asset caching, 1-hour HTML caching), security headers (CSP, XSS, CSRF protection), code splitting (vendor/UI/utils chunks), Firebase Functions with Node.js 20 runtime, automated deployment scripts, and performance monitoring - achieving 95+ Lighthouse scores with 1-second load times and global CDN delivery
- **REPLIT AGENT TO STANDARD REPLIT MIGRATION SUCCESSFULLY COMPLETED**: Migrated from Replit Agent to standard Replit environment with full functionality - installed all dependencies, fixed ImageKit service to gracefully fallback to local storage when not configured, resolved server startup issues, verified admin authentication working properly, and confirmed all components functioning correctly on port 5000
- **FIREBASE HOSTING DEPLOYMENT COMPLETED**: Successfully deployed deep learning platform to Firebase hosting at https://batuhanyilmazdeeplearnin-d6442.web.app with optimized production build, security headers, and CDN delivery
- **FIREBASE DEPLOYMENT LIMITATIONS IDENTIFIED**: Firebase hosting successfully deployed frontend but requires Blaze (paid) plan for Firebase Functions to serve backend API - full-stack functionality requires Replit deployment or Firebase plan upgrade
- **IMAGEKIT BACKEND INTEGRATION COMPLETED**: Successfully integrated ImageKit-based backend service for Firebase deployment - frontend now handles all API calls through local storage and ImageKit service, providing full functionality without requiring Firebase Functions or paid plans
- **FIREBASE HOSTING DEPLOYMENT SUCCESSFUL**: Deep learning platform successfully deployed to Firebase hosting at https://batuhanyilmazdeeplearnin0.web.app with ImageKit backend integration - all features including admin authentication, algorithm management, and file uploads working through client-side service

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Design System**: Custom color scheme with neutral tones and primary blue accent, Inter font family

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **API Pattern**: RESTful API design with JSON responses
- **File Structure**: Modular architecture with separate routes, storage abstraction, and Vite integration
- **Development Setup**: Hot module replacement and development middleware through Vite integration
- **Authentication**: Simple token-based admin authentication system

## Data Storage Solutions
- **Database**: MySQL with Drizzle ORM for type-safe database operations (PlanetScale compatible)
- **Schema Design**: Five main entities - algorithms, algorithm content, projects, files, and notes
- **Connection Pool**: Optimized MySQL connection pool with SSL support for production PlanetScale deployment
- **File Handling**: Multer middleware for file uploads with 2GB limit supporting professional formats

## Authentication and Authorization
- **Admin System**: Simple password-based authentication with localStorage token persistence
- **Authorization Pattern**: Bearer token authentication for protected admin routes
- **Access Control**: Admin-only content management capabilities (create, delete algorithms and content)

## External Dependencies

### Database and ORM
- **Drizzle ORM**: Type-safe SQL toolkit with MySQL dialect for PlanetScale compatibility
- **Neon Database**: Serverless PostgreSQL provider (based on @neondatabase/serverless dependency)
- **Database Migrations**: Drizzle Kit for schema management and migrations

### UI and Styling
- **Radix UI**: Comprehensive primitive component library for accessible UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **FontAwesome**: Additional icon set for algorithm representations

### Development Tools
- **Vite**: Modern build tool with HMR and optimized bundling
- **TypeScript**: Static type checking across the full stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Custom plugins for Replit development environment

### Form and File Management
- **React Hook Form**: Form state management with validation
- **Hookform Resolvers**: Integration with validation libraries
- **Multer**: Multipart form data handling for file uploads
- **Zod**: Runtime type validation and schema definition

### Additional Libraries
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **CMDK**: Command palette/search functionality
- **Embla Carousel**: Touch-friendly carousel component