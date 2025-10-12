# Tasks

Below is a sequential list of all tasks required to go from an empty project directory to a complete product. Each task is bite-sized with clear acceptance criteria that can be verified (often by running commands or tests). The development will pause after each task for review before proceeding.

## Planning & Audit

- [x]  **Audit and further breakdown Tasks.md**: Review all tasks for alignment with PRD.md, Design.md, API.md, Database.md, Providers.md, and docs/ui/*. Ensure the next 20 tasks are granular, verifiable steps toward a working demo. Remove or relocate inconsistent items and resolve duplicates.

    **Acceptance Criteria:**
    
    - Next 20 tasks are present as a dedicated section near the top, each with clear, testable acceptance criteria.
    - Duplicated tasks are removed (e.g., duplicate "Environment Templates").
    - The outdated "Feature Implementation — Tasks API" section is removed if inconsistent with the current plan of record (Next.js chat app with threads/messages).
    - Existing later sections remain intact for future work.
    - (Verification: Opening `docs/Tasks.md` shows the new audit task, the new "Next 20 Tasks — Working Demo Track" section, no duplicate env template task, and no Tasks API section.)
    - _Confirmation:_ Task completed - restructured Tasks.md with proper Next 20 Tasks section, removed duplicate Environment Templates task, removed inconsistent Tasks API section, and ensured all tasks align with PRD.md and Design.md requirements.

## Next 20 Tasks — Working Demo Track (Phase-Based)

Based on senior engineering feedback, these tasks are organized into phases that deliver verifiable functionality incrementally. Each phase builds upon the previous one, ensuring clear client verification at every step.

### Phase 1: Foundation and Authentication (Tasks 1-6)

- [x] 1) Setup local PostgreSQL using Docker
    
    **Acceptance Criteria:**
    - Create `docker-compose.yml` file with PostgreSQL service configuration
    - Configure PostgreSQL with database name 'bombay_dev', user 'bombay', and secure password
    - Add Docker database URL to `.env.example` and document in `docs/DEV.md`
    - Verify connection: `docker compose up -d` starts database successfully
    - Prisma can connect to Docker PostgreSQL instance
    - Include instructions for starting/stopping database in development docs
    - **Client Verification:** Database accessible at localhost:5432, Prisma connection test succeeds

- [x] 2) Extend Prisma schema for NextAuth
    
    **Acceptance Criteria:**
    - Add dependencies: next-auth, @next-auth/prisma-adapter
    - Extend prisma/schema.prisma with NextAuth models (Account, Session, VerificationToken) and relation to User
    - Run migration: npx prisma migrate dev -n auth_models
    - prisma generate succeeds
    - **Client Verification:** Database schema includes all auth-related tables

- [x] 3) Configure NextAuth with Google provider
    
    **Acceptance Criteria:**
    - Install Google provider dependencies
    - Create app/api/auth/[...nextauth]/route.ts with Google provider configured from env
    - Wire PrismaAdapter to connect auth to database
    - Add NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID/SECRET to .env.example
    - Export a server helper (auth()) to get the current session
    - Sign-in/sign-out endpoints work (HTTP 200/302)
    - **Client Verification:** Can sign in with Google account and see session data

- [x] 4) Create protected route with user display
    
    **Acceptance Criteria:**
    - Add minimal auth UI (Sign in / Sign out) in header
    - Display session.user.email when logged in
    - Protect main chat interface - redirect to sign-in if not authenticated
    - Keyboard/focus accessible; selectors documented if needed
    - **Client Verification:** Client can sign in with Google and see their email displayed

- [x] 5) Implement auth middleware for API routes
    
    **Acceptance Criteria:**
    - Create requireUser() utility that returns current user or 401 with standard error envelope
    - Protect /api/threads, /api/messages routes - refuse unauthenticated access
    - Use standard error envelope: { error: { code, message, details } }
    - **Client Verification:** API routes return 401 when not authenticated

- [x] 6) Database integration for user-specific threads
    
    **Acceptance Criteria:**
    - Modify GET /api/threads to fetch user's threads from Postgres (Prisma)
    - Modify POST /api/threads to create thread for current user; returns thread JSON
    - Zod validation; error envelope on failure; proper user isolation
    - **Client Verification:** Client can create threads that persist after page refresh

### Phase 2: Core Chat Functionality with OpenAI (Tasks 7-11)

- [x] 7) Messages API with database persistence

- [x] 8) OpenAI adapter implementation (non-streaming)
    
    **Acceptance Criteria:**
    - GET /api/messages?threadId=… returns messages for owned thread (order ascending)
    - POST /api/messages creates a user message row; returns created record
    - Proper user/thread ownership validation; 403 if not owned by user
    - **Client Verification:** User messages are saved to database and persist

- [ ] 8) OpenAI adapter implementation (non-streaming)
    
    **Acceptance Criteria:**
    - Install openai SDK dependency
    - Create server-only OpenAI adapter module implementing ProviderAdapter interface
    - Add OPENAI_API_KEY to environment variables
    - Implement adapter.chat() for gpt-4o and gpt-4o-mini models
    - POST /api/messages triggers OpenAI call and returns assistant message (non-streaming first)
    - Proper error envelope on provider failure; never expose raw API errors
    - **Client Verification:** Client can send message and receive OpenAI response

- [x] 9) Database seeding for development
    
    **Acceptance Criteria:**
    - Create prisma/seed.ts with dev user (from SEED_USER_EMAIL) and sample threads/messages
    - Add npm run db:seed script to package.json
    - Document seeding process in docs/DEV.md
    - Seed data appears via /api endpoints after sign-in
    - **Client Verification:** Fresh database can be seeded with test data for development

- [x] 10) Server-Sent Events streaming for OpenAI
    
    **Acceptance Criteria:**
    - Implement SSE on POST /api/messages route per docs/API.md specification
    - Stream events: 'delta' (token chunks), 'done' (with messageId and usage), 'error'
    - Client-side EventSource handling to display response token-by-token
    - Support for client-initiated cancellation via AbortController
    - **Client Verification:** Client sees AI response appearing progressively, not all at once

- [ ] 11) Error handling and API standardization
    
    **Acceptance Criteria:**
    - Implement shared error helper with standard envelope structure
    - Handle OpenAI API errors gracefully - map to generic user messages
    - Add request validation with Zod schemas for all routes
    - Return appropriate HTTP status codes (400 validation, 401 auth, 403 forbidden, 500 server)
    - **Client Verification:** API errors are handled gracefully with user-friendly messages

### Phase 3: Multi-Provider Support and Model Switching (Tasks 12-17)

- [ ] 12) Anthropic adapter implementation
    
    **Acceptance Criteria:**
    - Install @anthropic-ai/sdk dependency
    - Add ANTHROPIC_API_KEY to environment variables
    - Create Anthropic adapter implementing ProviderAdapter interface
    - Support claude-3-5-sonnet and claude-3-5-haiku models
    - Error handling and timeout management
    - **Client Verification:** System can route to Anthropic when configured

- [ ] 13) Provider routing and model switcher UI
    
    **Acceptance Criteria:**
    - Implement PATCH /api/threads/:id to update activeModel (zod-validated, user-owned)
    - Add model selector dropdown to UI with available models
    - Route requests to OpenAI vs Anthropic based on thread.activeModel
    - Display current model in thread header
    - **Client Verification:** Client can switch between OpenAI and Anthropic models

- [ ] 14) Mid-conversation model switching
    
    **Acceptance Criteria:**
    - Preserve conversation context when switching models mid-thread
    - New model receives full message history from database
    - Assistant messages tagged with provider and model used
    - Optional inline indicator when model is switched
    - **Client Verification:** Client can switch models mid-conversation and context is preserved

- [ ] 15) Context window truncation logic
    
    **Acceptance Criteria:**
    - Implement context truncation utility per Design.md specification
    - Model-specific token limits (conservative estimates)
    - Preserve system message, truncate oldest user/assistant pairs when needed
    - Unit tests covering long conversation scenarios
    - Works for both OpenAI and Anthropic providers
    - **Client Verification:** Long conversations don't hit context window errors

- [ ] 16) Enhanced UI error states and loading
    
    **Acceptance Criteria:**
    - Loading states with aria-busy during async operations
    - Error states with retry buttons for failed requests
    - Empty states when no threads or messages exist
    - Keyboard shortcuts: Cmd/Ctrl+N for new thread, Enter to send, Shift+Enter for newline
    - **Client Verification:** UI feels responsive and handles errors gracefully

- [ ] 17) Mobile responsive layout
    
    **Acceptance Criteria:**
    - Thread tray becomes overlay/modal on mobile (<768px)
    - Toggle button to open/close thread tray
    - Chat interface remains fully functional on mobile
    - Touch-friendly interaction targets
    - **Client Verification:** App works well on mobile devices

### Phase 4: Testing and Polish (Tasks 18-20)

- [ ] 18) Integration testing suite
    
    **Acceptance Criteria:**
    - Write integration tests for all API endpoints (auth, threads, messages)
    - Test authentication flows (401/403 scenarios)
    - Test provider integration with both OpenAI and Anthropic
    - Test error handling and validation scenarios
    - Tests run via npm script and pass locally
    - **Client Verification:** Comprehensive test coverage ensures reliability

- [ ] 19) End-to-end testing with Playwright
    
    **Acceptance Criteria:**
    - Implement Playwright tests covering complete user workflows
    - Test sign-in, thread creation, message sending, model switching
    - Test UI states: loading, error handling, mobile responsive
    - Tests use proper selectors per docs/ui/selectors.md
    - **Client Verification:** Critical user flows are automatically tested

- [ ] 20) Code quality and final polish
    
    **Acceptance Criteria:**
    - ESLint and TypeScript checks pass without errors
    - Code formatting with Prettier applied consistently
    - Remove debug statements and commented code
    - Update documentation with final API and usage instructions
    - **Client Verification:** Codebase is clean, well-documented, and production-ready

## Reference Tasks (Completed Foundation Work)

For reference, the following foundation tasks have been completed:

### Project Setup and Configuration
- [x] AGENTS.md created with agent instructions
- [x] CLAUDE.md symlink created for Claude Code compatibility
- [x] Development environment verified (Homebrew, Node.js, Python)
- [x] Git repository initialized and connected to GitHub
- [x] Next.js application scaffolded with TypeScript and Tailwind
- [x] Prisma schema configured per docs/Database.md
- [x] Temporary fixture-backed API routes implemented
- [x] Playwright E2E testing configured
- [x] Environment templates created (.env.example)
- [x] Auth and provider dependencies installed

## Additional Reference Tasks (Future Development)

The following sections contain additional tasks for future development and deployment phases. These are maintained for reference but are superseded by the phase-based approach in the Next 20 Tasks section above.

- [ ]  3) Loading states + aria-busy: Add skeletons/placeholders and `aria-busy="true"` during async fetches for threads/messages.
    
    **Acceptance Criteria:**
    
    - `[data-testid="thread-tray"][aria-busy="true"]` during thread load.
    - Message transcript shows loading placeholder while fetching messages.
    - (Verification: Introduce artificial delay; observe attributes and placeholder elements.)

- [ ]  4) Error states + retry: Show `[data-testid="error-state"]` with message and a retry button on fetch errors for threads/messages.
    
    **Acceptance Criteria:**
    
    - Error component renders on non-2xx responses.
    - Clicking retry re-issues the request and recovers to normal state when successful.
    - (Verification: Force 500 via MSW; click retry; verify recovery.)

- [ ]  5) Mobile layout (thread tray overlay): Convert thread tray to an overlay/modal under 768px with a toggle button.
    
    **Acceptance Criteria:**
    
    - On small viewport, `[data-testid="thread-tray"]` becomes overlay.
    - Toggle opens/closes tray; chat remains usable.
    - (Verification: Resize to mobile width; confirm behavior matches A10.)

- [ ]  6) Keyboard shortcuts: Implement Cmd/Ctrl+N for new thread (focus composer), Enter to send (when non-empty), Shift+Enter to newline.
    
    **Acceptance Criteria:**
    
    - Pressing Cmd/Ctrl+N adds a new thread in UI and focuses `[data-testid="composer-input"]`.
    - Enter sends when composer non-empty; Shift+Enter inserts a newline.
    - (Verification: Manual and Playwright checks per A9.)

- [ ]  7) Accessibility semantics: Ensure semantic structure and ARIA labels align with docs/ui/selectors.md and Accessibility guidance.
    
    **Acceptance Criteria:**
    
    - `role="main"` on chat pane, `role="alert"` on error states.
    - Proper heading hierarchy and `aria-label` on key controls.
    - (Verification: Automated axe scan shows no violations at Level AA; keyboard-only navigation works.)

- [ ]  8) Selector audit: Confirm all `data-testid` match docs/ui/selectors.md and add any missing attributes.
    
    **Acceptance Criteria:**
    
    - Elements include: `app-shell`, `thread-tray`, `thread-list`, `thread-item`, `thread-title`, `model-switcher`, `transcript`, `typing-indicator`, `composer`, `composer-input`, `composer-send`, `brand-swatch`.
    - (Verification: Inspect DOM; ensure presence and correct values.)

- [ ]  9) Dev-only MSW bootstrap: Install and configure MSW (browser worker) to serve fixture data from `docs/ui/fixtures` during development.
    
    **Acceptance Criteria:**
    
    - `msw` dependency added; worker initialized in dev only.
    - Handlers implemented for `GET /api/threads`, `GET /api/messages?threadId=...`, `PATCH /api/threads/:id`.
    - `POST /api/messages` may continue using Next route SSE stub for streaming.
    - (Verification: With `NEXT_PUBLIC_API_MOCKING=1`, network requests show mocked responses.)

- [ ]  10) MSW fixture handlers: Map handlers to JSON fixtures and add realistic delays.
    
    **Acceptance Criteria:**
    
    - Handlers read from `docs/ui/fixtures/*.json`.
    - Delays configurable (e.g., 200–600ms) to exercise loading states.
    - (Verification: Logs show handler hits; UI displays skeletons then data.)

- [ ]  11) Mocking toggle: Add env-controlled toggle (e.g., `NEXT_PUBLIC_API_MOCKING=1`) and document it in docs/DEV.md.
    
    **Acceptance Criteria:**
    
    - Mocking starts automatically in dev when toggle is set.
    - Production builds do not include/initialize the worker.
    - (Verification: Build output excludes MSW; dev includes worker registration.)

- [ ]  12) Playwright: Add initial e2e suite scaffolding `e2e/ui.spec.ts` covering A1 (shell) and B1–B2 (brand font and dark theme vars).
    
    **Acceptance Criteria:**
    
    - `e2e/ui.spec.ts` exists and `npm run test:e2e` executes it.
    - Tests assert presence of core selectors and brand variables.
    - (Verification: Tests pass locally.)

- [ ]  13) Playwright: Add A2 (fixture data loads) using MSW fixtures.
    
    **Acceptance Criteria:**
    
    - Test asserts 5 thread items and exact titles from fixtures.
    - First thread has `data-active="true"`.
    - (Verification: Test passes.)

- [ ]  14) Playwright: Add A3 (thread selection) and A4 (model retention per thread).
    
    **Acceptance Criteria:**
    
    - Clicking different thread updates active state and header title.
    - Model selection persists per thread within session.
    - (Verification: Tests pass.)

- [ ]  15) Playwright: Add A5 (message send flow) using SSE stub.
    
    **Acceptance Criteria:**
    
    - Composer clears and disables during response; typing indicator visible.
    - Assistant message streams in; indicator hides when done.
    - (Verification: Tests pass.)

- [ ]  16) Playwright: Add A6–A8 (empty, loading, error) by toggling MSW responses and delays.
    
    **Acceptance Criteria:**
    
    - Empty state test shows welcome/empty UI.
    - Loading state test observes `aria-busy` and skeletons.
    - Error test shows error state and successful retry.
    - (Verification: Tests pass.)

- [ ]  17) Responsive test A10: Verify mobile overlay behavior of thread tray.
    
    **Acceptance Criteria:**
    
    - Set viewport to mobile; assert tray becomes overlay and is toggleable.
    - (Verification: Test passes.)

- [ ]  18) Brand tests B3–B5: Gradient, accessibility checks, favicon and metadata verification.
    
    **Acceptance Criteria:**
    
    - Gradient background-image present on brand swatch.
    - Contrast checks meet guidance; favicon present and accessible.
    - (Verification: Tests pass.)

- [ ]  19) Developer docs: Update `docs/DEV.md` with MSW usage, mocking toggle, and testing commands.
    
    **Acceptance Criteria:**
    
    - DEV.md includes steps to enable/disable mocks and run E2E.
    - (Verification: File updated; instructions work as written.)

- [ ]  20) Task list hygiene: Remove duplicates and inconsistent sections, and confirm ordering.
    
    **Acceptance Criteria:**
    
    - Duplicate "Environment Templates" entry removed.
    - "Feature Implementation — Tasks API" removed (inconsistent).
    - Next 20 tasks appear in order at top for the agent to execute sequentially.
    - (Verification: `docs/Tasks.md` reflects the new ordering and content.)

## UI Specification Implementation

### LLM-Friendly Mock Setup

- [ ]  **Create UI Specification Structure**: Set up the complete `docs/ui/` folder structure with all machine-readable specifications that Claude Code can use to build the chat interface deterministically.
    
    **Acceptance Criteria:**
    
    - `docs/ui/` directory exists with design tokens, component specs, fixtures, and wireframes
    - `docs/ui/tokens.json` contains color, font, spacing, and other design tokens
    - `docs/ui/components.md` defines component inventory and structure
    - `docs/ui/selectors.md` specifies canonical `data-testid` selectors for testing
    - `docs/ui/states.md` documents component states and behaviors
    - `docs/ui/fixtures/` contains JSON mock data (models.json, threads.json, messages.json, user.json)
    - `docs/ui/wireframes/chat.html` provides copy-ready HTML structure with proper selectors
    - `docs/ui/flows.md` documents user interaction flows and keyboard shortcuts
    - `docs/ui/acceptance.md` defines testable acceptance criteria
    - (Verification: All files exist with comprehensive content. Claude Code can read the specifications and understand the complete UI requirements without ambiguity.)

### Brand System Setup

- [ ]  **Add Brand Tokens**: Update design tokens with bombay brand palette, IBM Plex Mono font, and new design system.
    
    **Acceptance Criteria:**
    
    - `docs/ui/tokens.json` contains bombay brand colors (dark and light themes)
    - Font definition uses IBM Plex Mono as primary font
    - Brand colors include: brand-600 (#E11D74), brand-500 (#FF2E88), brand-300 (#FFA6D1), brand-100 (#FFE4F0)
    - Radius values use 12px (md) and 16px (xl) for bombay's shape language
    - Gradient and elevation tokens include pink-tinted shadows
    - (Verification: JSON file contains keys: `font.mono`, `color.dark.bg`, `color.light.bg`, `gradient.brand` with correct bombay values.)

- [ ]  **Configure Tailwind & CSS Variables**: Set up Tailwind configuration and CSS custom properties for theme switching.
    
    **Acceptance Criteria:**
    
    - `tailwind.config.ts` extends theme with brand color variables and IBM Plex Mono font
    - `app/globals.css` defines CSS variables for dark/light themes with bombay colors
    - Dark theme set as default with `data-theme="dark"` on body
    - CSS variables follow pattern: `--color-bg`, `--color-brand-500`, etc.
    - Custom scrollbar styling with brand accent colors
    - (Verification: Playwright check: `document.body.getAttribute('data-theme') === 'dark'`; CSS var `--color-bg` equals `#0B1220`.)

- [ ]  **Add IBM Plex Mono Font**: Integrate IBM Plex Mono via Google Fonts in Next.js layout.
    
    **Acceptance Criteria:**
    
    - IBM Plex Mono loaded in `app/layout.tsx` with weights 400, 500, 600, 700
    - Font variable `--font-mono` properly configured
    - Body element uses `font-mono` class
    - Font loads with swap display for performance
    - (Verification: Computed `font-family` on `body` contains "IBM Plex Mono".)

- [ ]  **Add Brand Assets**: Create wordmark SVG and favicon with bombay branding.
    
    **Acceptance Criteria:**
    
    - `public/brand/wordmark.svg` contains bombay wordmark with gradient and caret bar
    - `public/favicon.svg` contains monogram-style 'b' in brand colors
    - Favicon properly referenced in layout metadata
    - SVG assets use proper gradient definitions and dark background
    - (Verification: `GET /favicon.svg` returns 200; `<link rel="icon">` present in HTML.)

- [ ]  **Create Brand Guidelines**: Document brand usage rules and component recipes for consistent implementation.
    
    **Acceptance Criteria:**
    
    - `docs/brand.md` contains comprehensive brand guidelines
    - Guidelines specify lowercase "bombay" usage and IBM Plex Mono requirement
    - Tailwind component recipes provided for buttons, panels, and form elements
    - Color accessibility notes and contrast requirements documented
    - Theme implementation details and CSS variable structure explained
    - (Verification: File exists; contains "Always use lowercase" and component recipes.)

- [ ]  **Validate Brand Implementation**: Add brand-specific acceptance tests and verify consistent application.
    
    **Acceptance Criteria:**
    
    - Brand validation tests added to `docs/ui/acceptance.md` (B1-B5)
    - Tests verify IBM Plex Mono font loading and application
    - Tests check CSS custom properties and theme variables
    - Brand gradient and color accessibility validated
    - Favicon and metadata properly configured
    - (Verification: Acceptance criteria B1-B5 added; tests can verify font, colors, and assets.)

- [ ]  **Implement Mock Service Worker (MSW) Setup**: Configure MSW in the Next.js application to serve fixture data and enable UI development before backend exists.
    
    **Acceptance Criteria:**
    
    - MSW is installed and configured in the Next.js project
    - Mock handlers serve data from `docs/ui/fixtures/` files
    - API endpoints match the defined contract: `GET /api/threads`, `GET /api/messages?threadId=...`, `PATCH /api/threads/:id`, `POST /api/messages`
    - Mock responses include proper HTTP status codes and realistic delays
    - Development server works with mocks (no real backend required)
    - (Verification: Frontend runs with `npm run dev`, makes API calls that return fixture data. Network tab shows mocked responses. UI displays sample conversations from fixtures.)

- [ ]  **Add Playwright End-to-End Testing**: Set up Playwright with the basic acceptance test suite to verify UI functionality against the specification.
    
    **Acceptance Criteria:**
    
    - Playwright is installed and configured in the project
    - `e2e/ui.spec.ts` implements the acceptance checks from `docs/ui/acceptance.md`
    - Tests use the canonical selectors from `docs/ui/selectors.md`
    - Test covers: shell rendering, fixture data loading, thread switching, model selection, message sending flow
    - `npm run test:e2e` executes tests against running dev server with mocks
    - All acceptance tests pass, confirming UI meets specification
    - (Verification: Running `npx playwright test` shows all tests passing. Tests successfully locate elements using data-testid selectors and verify expected behaviors.)

### Chat UI Implementation

- [ ]  **Build Chat Interface from Wireframe**: Implement the complete chat UI using the HTML wireframe and design tokens, ensuring all required selectors are present.
    
    **Acceptance Criteria:**
    
    - Chat interface matches the structure from `docs/ui/wireframes/chat.html`
    - All components use design tokens from `docs/ui/tokens.json`
    - Every interactive element has the correct `data-testid` from `docs/ui/selectors.md`
    - Layout is responsive (mobile overlay, desktop sidebar)
    - Visual design uses Tailwind CSS with proper styling
    - Components are properly structured (ThreadTray, ChatPane, Composer, etc.)
    - (Verification: UI renders without errors, visually matches wireframe intent, all acceptance test selectors are found, responsive design works on different screen sizes.)

- [ ]  **Implement State Management and Interactions**: Add React state management and user interactions to make the UI fully functional with mock data.
    
    **Acceptance Criteria:**
    
    - Thread selection switches active conversation and loads messages
    - Model switcher updates thread settings and applies to future messages
    - Message composer handles input, validation, and sending
    - Typing indicators appear during simulated assistant responses
    - Loading and error states display properly
    - Keyboard shortcuts work (Cmd+N for new thread, Enter to send, etc.)
    - All user flows from `docs/ui/flows.md` function correctly
    - (Verification: All Playwright acceptance tests pass. User can interact with every feature. State persists correctly when switching threads. No console errors during normal usage.)

- [ ]  **Add Real-time Message Streaming**: Implement streaming responses for assistant messages to simulate the real chat experience.
    
    **Acceptance Criteria:**
    
    - Assistant messages stream in progressively (not all at once)
    - Typing indicator shows during streaming, disappears when complete
    - User cannot send messages while assistant is responding
    - Streaming works with mock WebSocket or Server-Sent Events
    - Auto-scroll keeps latest content visible during streaming
    - Stream can be cancelled if user navigates away
    - (Verification: Sending a message shows typing indicator, then assistant response appears word-by-word. UI remains responsive during streaming. All streaming edge cases handled gracefully.)

### Progressive Enhancement

- [ ]  **Replace Mocks with Real API Integration**: Swap MSW mocks for actual backend API calls while keeping all selectors and UI behavior unchanged.
    
    Note: Superseded by the detailed "Next 16 Tasks — Auth, DB, and Real API Track" (N1–N16). Keep this as a reference umbrella task only.
    
    **Acceptance Criteria:**
    
    - API client configured to call real backend endpoints
    - Authentication and error handling implemented
    - SSE streaming implemented per docs/API.md
    - Mock responses are replaced but UI behavior stays identical
    - All Playwright tests continue passing with real backend
    - Graceful fallback if backend is unavailable
    - (Verification: UI works with real API, all features functional, no behavior changes from user perspective. Tests pass against real backend. Error states handle API failures appropriately.)

- [ ]  **Performance Optimization and Polish**: Optimize the chat interface for production use with proper loading states, caching, and performance improvements.
    
    **Acceptance Criteria:**
    
    - Message history pagination for long conversations
    - Optimistic updates for better perceived performance
    - Proper loading skeletons and transitions
    - Image/media handling in messages (if applicable)
    - Accessibility improvements (ARIA labels, keyboard navigation)
    - Bundle size optimization and code splitting
    - Service worker for offline functionality (optional)
    - (Verification: Lighthouse scores 90+ for Performance, Accessibility, Best Practices. Large conversations load smoothly. App feels responsive under normal usage patterns.)

## Production Deployment

### API Keys and External Services

- [ ]  **Generate AI Provider API Keys**: Request user to create API keys for OpenAI and Anthropic services.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Sign up for OpenAI account at https://platform.openai.com
      - Generate API key with appropriate usage limits
      - Sign up for Anthropic account at https://console.anthropic.com  
      - Generate API key for Claude access
      - Store keys securely for environment variable configuration
    - Agent waits for user confirmation that keys have been generated
    - Keys follow format: `sk-...` for OpenAI, `sk-ant-...` for Anthropic
    - (Verification: User confirms API keys are generated and ready for deployment setup.)

### Hosting Platform Setup

- [ ]  **Set Up Vercel Account and Project**: Request user to create Vercel account and connect GitHub repository.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Sign up for Vercel account at https://vercel.com
      - Connect GitHub account and authorize Vercel access
      - Import the bombay GitHub repository as new Vercel project
      - Configure project settings (Next.js framework auto-detected)
      - Set Node.js version to 18+ in project settings
    - Agent waits for user confirmation that Vercel project is created
    - Initial deployment should succeed (may have missing env vars)
    - (Verification: User confirms Vercel project exists and initial deployment completed.)

- [ ]  **Configure Production Environment Variables**: Set up API keys and database connection in Vercel dashboard.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Access Vercel project dashboard → Settings → Environment Variables
      - Add production environment variables:
        - `OPENAI_API_KEY` (from previous step)
        - `ANTHROPIC_API_KEY` (from previous step)
        - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (OAuth setup)
        - `NEXTAUTH_SECRET` (generate random 32+ char string)
        - `DATABASE_URL` (managed Postgres connection string)
        - `NEXTAUTH_URL` (https://bombay.chat)
      - Trigger new deployment after environment variables are set
    - All environment variables properly configured for production
    - New deployment succeeds with all services connected
    - (Verification: Environment variables configured, deployment succeeds, app functional on Vercel domain.)

### Domain Configuration

- [ ]  **Configure Custom Domain**: Set up bombay.chat domain to point to Vercel deployment.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Access Vercel project dashboard → Settings → Domains
      - Add custom domain: bombay.chat
      - Copy DNS configuration values from Vercel (CNAME/A records)
      - Log into Porkbun account at https://porkbun.com
      - Navigate to DNS management for bombay.chat domain
      - Update DNS records to point to Vercel (remove default parking)
      - Wait for DNS propagation (5-60 minutes)
    - SSL certificate automatically provisioned by Vercel
    - Domain resolves to bombay application
    - HTTPS redirect properly configured
    - (Verification: https://bombay.chat loads the application with valid SSL certificate.)

### Database Setup

- [ ]  **Set Up Production Database**: Configure managed Postgres database for production use.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Choose managed Postgres provider (Neon/Supabase/Vercel Postgres)
      - Create production database instance
      - Configure connection settings (SSL required)
      - Copy database connection string
      - Add `DATABASE_URL` to Vercel environment variables
      - Run Prisma migrations: `npx prisma db push` (or setup auto-migration)
    - Database schema matches development (users, threads, messages tables)
    - Connection secure with SSL/TLS encryption
    - Prisma can successfully connect and query database
    - (Verification: Database connected, tables created, application can read/write data in production.)

### Production Validation

- [ ]  **Test End-to-End Production Flow**: Validate complete application functionality on live domain.
    
    **Acceptance Criteria:**
    
    - Navigate to https://bombay.chat and verify application loads
    - Test Google OAuth sign-in flow works in production
    - Create new chat thread and verify database persistence
    - Send message and verify AI provider integration (OpenAI/Anthropic)
    - Test model switching mid-conversation
    - Verify message history persists across sessions
    - Check SSL certificate validity and security headers
    - Test responsive design on mobile and desktop
    - Verify no console errors or broken functionality
    - (Verification: All core features work correctly on production domain with real user flow.)

### Local Development Setup

- [ ]  **Document Local Development Process**: Create clear instructions for running bombay locally.
    
    **Acceptance Criteria:**
    
    - Update README.md with local development section:
      - Prerequisites: Node.js 18+, PostgreSQL (local or remote)
      - Clone repository and install dependencies: `npm install`
      - Set up `.env.local` with development environment variables
      - Initialize database: `npx prisma db push`
      - Start development server: `npm run dev`
      - Access local app at http://localhost:3000
    - Include troubleshooting section for common issues
    - Document how to switch between local and production databases
    - Provide example `.env.local` template with placeholder values
    - (Verification: Following README instructions results in working local development environment.)
