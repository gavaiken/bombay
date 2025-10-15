# Bombay Chat

> A multi-provider AI chat application that seamlessly switches between different AI models mid-conversation.

## Overview

Bombay is a web-based chat application built with Next.js that allows users to converse with AI models from multiple providers (OpenAI, Anthropic) and seamlessly switch between them during a conversation while maintaining context.

### Key Features

- **Multi-Provider Support**: Switch between OpenAI GPT and Anthropic Claude models mid-conversation
- **Context Preservation**: Conversation history is maintained when switching models
- **Persistent Threads**: Multiple saved conversations in a sidebar
- **Streaming Responses**: Real-time message streaming with typing indicators
- **Google Authentication**: Secure sign-in with personal data isolation
- **Mobile Responsive**: Optimized layout for mobile devices
- **Test Model**: Built-in "Repeat After Me" model for testing without API costs

## Architecture

### Tech Stack

- **Frontend**: React, Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Node.js runtime
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth) with Google OAuth
- **AI Providers**: OpenAI SDK, Anthropic SDK
- **Deployment**: Vercel with custom domain

### Project Structure

```
bombay/
├── app/                     # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── threads/         # Thread CRUD operations
│   │   └── messages/        # Message streaming & persistence
│   ├── components/          # React components
│   └── globals.css          # Global styles & brand system
├── lib/                     # Shared utilities
│   ├── providers/           # AI provider adapters
│   │   ├── openai.ts        # OpenAI integration
│   │   ├── anthropic.ts     # Anthropic integration
│   │   ├── test.ts          # Test "repeat after me" model
│   │   └── index.ts         # Provider routing
│   ├── authz.ts             # Authentication helpers
│   ├── context.ts           # Message truncation logic
│   └── prisma.ts            # Database client
├── prisma/                  # Database schema & migrations
├── docs/                    # Project documentation
└── tests/                   # Testing suites
```

### Provider System

The application uses a provider adapter pattern to support multiple AI services:

- **OpenAI Adapter** (`lib/providers/openai.ts`): GPT-4o, GPT-4o-mini
- **Anthropic Adapter** (`lib/providers/anthropic.ts`): Claude 3.5 Haiku, Claude Sonnet 4
- **Test Adapter** (`lib/providers/test.ts`): "Repeat After Me" for testing

Model IDs follow the format `provider:model-name` (e.g., `openai:gpt-4o`, `test:repeat-after-me`).

### Message Flow

1. User sends message via the composer
2. Message is saved to database with thread association
3. Provider adapter is selected based on thread's active model
4. AI response streams via Server-Sent Events (SSE)
5. Complete response is saved to database
6. Context is preserved for model switching

## Local Development Setup

### Prerequisites

Ensure you have Node.js 18+ and PostgreSQL installed or accessible (you can use a local Postgres instance or a remote one). These are required to run the project.

### Setup and Run:

- Clone the Repository: Clone the project code to your machine and navigate into the project directory.
- Install Dependencies: Run npm install to install all Node.js dependencies.
- Configure Environment: Create a file named .env.local in the project root. Populate it with the required environment variables (see example below and docs/ENV.md for the full list). This includes your Google OAuth credentials, database URL, API keys, etc.
- Initialize the Database: Make sure your Postgres server is running. Apply the Prisma schema to your dev database by running npx prisma db push. This will create the necessary tables (users, threads, messages) in your database.
- Start the Development Server: Run npm run dev. This will start the Next.js development server on port 3000.
- Open the App: Navigate to http://localhost:3000 in your browser. You should see the bombay.chat application loading. Sign in with Google and you’re ready to use the app locally.

Example .env.local file:

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="some-long-random-string"  # session encryption
NEXTAUTH_URL="http://localhost:3000"       # base URL for NextAuth (use localhost for dev)

# Database
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/bombay_dev"

# AI Provider API Keys
OPENAI_API_KEY="sk-...."        # OpenAI API key
ANTHROPIC_API_KEY="test-..."    # Anthropic API key

# (Optional) Rate Limiting with Upstash
UPSTASH_REDIS_REST_URL=""      # if using Upstash for rate limiting
UPSTASH_REDIS_REST_TOKEN=""

(Fill in each value with your own credentials and secrets; see docs/ENV.md for descriptions.)

Troubleshooting & Tips:

- If the server starts but you cannot connect, verify that PostgreSQL is running and that the DATABASE_URL is correct. For local Postgres, you may need to adjust the host/port or ensure the user and password are correct. If using a remote DB, ensure your local machine is allowed to access it (or use an SSH tunnel).
- Google OAuth issues: If Google sign-in fails on localhost, check that you have added http://localhost:3000 as an authorized OAuth redirect URI in your Google API Console credentials. Also double-check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET values.
- Database switching: By default, your .env.local points to a development database. To test against a different or production database, update the DATABASE_URL in .env.local (be cautious with production data). The app will use whatever database URL is set in the environment. Generally, use a separate local DB for dev to avoid affecting production data.
- If you encounter database schema mismatches, run npx prisma db push again to sync the schema. For significant schema changes, use Prisma migrations.
- Common issues: If npm run dev fails, try deleting node_modules and re-running npm install. Ensure you are using Node 18+ (run node -v). For any environment variable changes, restart the dev server since Next.js does not hot-reload env vars.

Available Scripts: In addition to dev, you can run npm run build to create a production build, and npm start to run the built app. There is also npm run lint for code linting, and npm run test:e2e to execute end-to-end tests (see docs/Testing.md).

Following these steps, you should have a working local development environment for bombay.chat. You can then log in, create chats, and switch models just as in production.

## Development & Testing

### Test Model

The application includes a special "Repeat After Me" test model that's perfect for development:

- **Model ID**: `test:repeat-after-me`
- **UI Label**: "Test — Repeat After Me"
- **Purpose**: Echoes back user input without using API quota
- **Features**: 
  - Zero API costs
  - Simulated streaming with 100ms word delays
  - Available in all environments (dev, staging, production)
  - Perfect for testing UI layouts, mobile responsiveness, and message flow

**Usage Example**:
```
User: "Hello world, test the layout!"
Assistant: "Hello world, test the layout!"
```

This model is especially useful for:
- Testing mobile UI without quota concerns
- Debugging layout issues with long messages
- E2E test scenarios
- Verifying streaming indicators and auto-scroll behavior

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Run production build locally
npm run lint         # Code linting
npm run test:e2e     # End-to-end tests with Playwright
npx prisma db push   # Apply schema changes to database
npx prisma studio    # Open database GUI
```

### Project Documentation

- `docs/PRD.md` - Product Requirements Document
- `docs/Design.md` - UI/UX specifications
- `docs/API.md` - API endpoints documentation
- `docs/Database.md` - Database schema
- `docs/Tasks.md` - Development task list
- `docs/Testing.md` - Testing strategies
- `docs/Deployment.md` - Production deployment guide

### Contributing

When adding new AI providers:

1. Create adapter in `lib/providers/[provider].ts`
2. Implement `ProviderAdapter` interface
3. Add to `lib/providers/index.ts` routing
4. Update UI model selector in `app/components/Chat.tsx`
5. Update provider types in `lib/providers/types.ts`
6. Add comprehensive inline documentation

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch. See `docs/Deployment.md` for detailed production setup instructions.

**Production URL**: https://bombay.chat

## License

This project is built for demonstration and educational purposes.
