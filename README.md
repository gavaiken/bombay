# Local Development Setup

Prerequisites: Ensure you have Node.js 18+ and PostgreSQL installed or accessible (you can use a local Postgres instance or a remote one). These are required to run the project.

Setup and Run:

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
