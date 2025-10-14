# Deployment

## Persistent logging (24h+)

We persist runtime logs to Better Stack (Logtail). This lets us inspect errors after the fact (no tailing on the CLI required).

### Setup (once)
1) Create a source at https://logs.betterstack.com and copy the Source token.
2) In Vercel → Project → Settings → Environment Variables, add:
   - LOGTAIL_SOURCE_TOKEN = <your-source-token> (Production + Preview)
3) Redeploy.

### What is logged
- NextAuth logger events (error/warn/debug)
- API errors from /api/messages (SSE provider errors)
- You can also instrument more code by importing logError/logInfo from lib/logger.

### Notes
- Logging is non-blocking: requests to Logtail abort after ~1.5s and failures are ignored.
- You can use a different sink (e.g., Sentry or Datadog log drain) by swapping lib/logger.ts implementation.

## Vercel Log Drains (alternative)
If you prefer a drain for platform logs, add a Log Drain integration in Vercel (Datadog, New Relic, Better Stack). This forwards function logs directly without code changes.

Deployment Runbook (Vercel + Porkbun)

This document outlines how to deploy the bombay.chat application to production. The target production environment is Vercel (for hosting the Next.js app and serverless functions), with the custom domain bombay.chat managed via Porkbun (domain registrar and DNS). Below are the steps and configurations for a successful deployment.

1. Version Control and CI

- Make sure all your code is in the main branch of the GitHub repository (or whichever branch you plan to deploy). Vercel integrates with GitHub to deploy on each push to a branch.
- If not already done, log in to Vercel and use the Import Project flow to connect the GitHub repo (the project name can be “bombay” or similar). Vercel will detect it’s a Next.js project.
- Choose the production branch (e.g., main) for Vercel to deploy from. Enable automatic deployments so that pushing to main triggers a new deployment.
- (Our setup assumes the initial code has been pushed and a Vercel project created. The following steps assume you have access to the Vercel dashboard for the project.)

2. Set Environment Variables on Vercel

Before deploying, configure all required environment variables in Vercel:

- In your Vercel dashboard, go to Settings > Environment Variables for the project.
- Add the following variables (mark them as Production and optionally set for Preview environments if needed):
  - GOOGLE_CLIENT_ID – the Google OAuth Client ID you obtained.
  - GOOGLE_CLIENT_SECRET – the Google OAuth Client Secret.
  - NEXTAUTH_SECRET – the secret for NextAuth (should be the same long random string used in dev).
  - NEXTAUTH_URL – set this to https://bombay.chat (the full URL of the production site). This ensures NextAuth knows the correct callback and site URL.
  - DATABASE_URL – the Postgres connection string for the production database (see next step on setting up the DB).
  - OPENAI_API_KEY – your OpenAI API key.
  - ANTHROPIC_API_KEY – your Anthropic API key.
  - UPSTASH_REDIS_REST_URL – (optional) Upstash Redis REST URL (if using rate limiting in production).
  - UPSTASH_REDIS_REST_TOKEN – (optional) Upstash Redis token.
- Double-check there are no typos. These will be provided to the app at build and runtime.
- After adding these, redeploy the Vercel project so that these env vars take effect in the build. (You can trigger a redeploy from the “Deployments” tab by clicking “Redeploy” or by pushing a commit.)

3. Provision the Production Database

Choose a managed PostgreSQL provider for production. Options include:

- Neon or Supabase: cloud Postgres services with free tiers.
- Vercel Postgres: Vercel’s built-in Postgres (in beta or generally available) which integrates well.
- Railway or AWS RDS/GCP Cloud SQL if you prefer.

Steps (assuming Neon for example):

- Create a new database instance (in Neon, create a new project, PostgreSQL 15+, smallest tier).
- Create a database (default name or custom) and a database user with a strong password.
- Obtain the connection string (Neon provides a URI like postgres://user:pass@host:port/database).
- Enable SSL if required (most managed DBs require SSL by default – Neon’s connection string often has sslmode=require).
- Take that connection string and set it as DATABASE_URL in Vercel as per step 2.

Run Database Migrations:

- The first deployment will need the DB schema. Since we are using Prisma, we have two ways:
  - Prisma Migrate: If you have a migration SQL script ready (from development), you could run npx prisma migrate deploy connected to the production DB.
  - Prisma DB Push: Alternatively, run npx prisma db push to push the schema directly. This will create the tables (User, Thread, Message) in the production database.
- We recommend doing this from your local machine: Temporarily set your local DATABASE_URL to the production string (with caution), then run the command. Prisma will create the schema. You can also use a Prisma Studio or psql just to verify tables are created.
- Once done, remove the production DB credentials from your local env to avoid accidental writes, or set it back to dev.
- (If using Vercel Postgres, they might have an integration where Vercel can run the migration for you on first deploy. In our case, explicit push is fine.) Ensure the database is reachable: Vercel’s network can reach most external DB providers by default. If using a cloud provider that requires whitelisting IPs (like some cloud SQL), configure that (Vercel provides egress IP ranges or you might use a pooling proxy). Neon and similar don’t require this step.

4. Vercel Deployment

With env vars and DB ready, the app is primed to run on Vercel:

- Vercel will run the build (npm run build). Ensure that in your package.json, the build script runs next build. Also, the PRISMA_GENERATE should run (Prisma’s client generation).
- After build, Vercel will host the app. The API routes become serverless functions. The NextAuth and streaming SSE should work on Vercel (Vercel Node runtime supports SSE as long as the function stays running—our usage is within limits).

Monitor the first deployment:

- Go to Deployments in Vercel, watch the logs. Look for any errors related to connecting to the database or missing env vars. If something like “database connect failed” appears, re-check the connection string and SSL requirements.
- If build or deploy fails due to Prisma, ensure the DATABASE_URL was set at build time. If Prisma client generation runs during build, it might attempt a connection. On Vercel, you can mark DATABASE_URL as Preview and Production env. If issues persist, consider adjusting prisma generate to not require an active DB connection. Usually, it doesn’t connect, it just uses the schema file.

Once deployment is successful, Vercel will give you a preview domain, like bombay-git-main-account.vercel.app or for production perhaps something like bombay.vercel.app. Test the app on the Vercel provided URL first:

- Visit the Vercel URL (e.g. https://your-project.vercel.app). It should load the app.
- Try signing in with Google. (You may need to add that Vercel URL as an authorized domain in Google OAuth consent if it’s not already covered. For initial test, you could skip sign-in if domain mismatch – or quickly add the Vercel domain in Google API console authorized domains to test).
- Since our NEXTAUTH_URL is currently set to bombay.chat, the Google callback might not work on the preview URL. You can temporarily set NEXTAUTH_URL to the Vercel URL for testing, or just proceed to the next step (domain setup) and test on the real domain. Alternatively, manually navigate to the callback URL on the Vercel domain after Google auth – but easiest is to set up the real domain now.

5. Configure the Custom Domain (bombay.chat)

We own the domain bombay.chat on Porkbun, and we want to point it to Vercel. On Vercel:

- In your project settings, go to Domains.
- Add a new domain: enter bombay.chat. Vercel will now wait for DNS verification.

On Porkbun (DNS provider):

- Log in to Porkbun, go to the domain management for bombay.chat.
- You need to add DNS records as instructed by Vercel. Typically:
  - If Vercel provided a verification record (sometimes a TXT record to prove ownership), add that first (e.g., a TXT record on _vercel or so). Vercel will show if needed.
  - Add an A record for the root domain (@) pointing to Vercel’s server IP, or a CNAME. Vercel often prefers an A record to some stable IPs or a CNAME to cname.vercel-dns.com. Check Vercel’s instructions. As of now, Vercel might provide A records to set.
  - Also add a CNAME for the www subdomain if you plan to support www (e.g., www.bombay.chat CNAME to cname.vercel-dns.com.). If not using www, you can skip or set it to redirect.
- Essentially, you are directing bombay.chat to Vercel. On Porkbun, remove any default parking page records. Use the DNS values given by Vercel (they often show something like “Add these records: ...”).

After updating DNS, it can take some time (5 minutes to an hour) to propagate. Vercel will continually check for the domain ownership verification:

- In Vercel, once it sees the correct DNS, it will mark the domain as verified and automatically provision an SSL certificate via Let’s Encrypt. This typically happens within a few minutes of DNS propagation.

You can use a DNS lookup tool to verify that bombay.chat now resolves to Vercel. For example, dig bombay.chat A should show Vercel’s IPs, and dig bombay.chat CNAME (if used) should show the Vercel cname.

6. Go Live and Verify

Once Vercel confirms the domain is added, test the live site:

- Visit https://bombay.chat in your browser. It should load the app over HTTPS (Vercel will have automatically set up SSL).
- Test the core functionality:
  - Google Sign-In: On production domain, the OAuth flow should work (ensure you added https://bombay.chat in Google console’s redirect URIs). You might need to deploy a change or ensure NEXTAUTH_URL was set to the custom domain (if you set it prior, it’s good). If you forgot, update NEXTAUTH_URL env on Vercel to https://bombay.chat and redeploy. Google should then redirect correctly.
  - Create a new thread, send a message. This will use the real API keys. The assistant should respond (verify that OpenAI/Anthropic keys are working). The response should stream.
  - Switch model mid-chat and send another message to ensure that works with both providers.
  - Check the database (you can connect with a client or Neon’s web console) to see that new records are being created properly in User, Thread, Message tables.
  - Log out, log in again, ensure you see the previous threads (persisted data).

DNS and SSL checks: Confirm that https://bombay.chat has a valid certificate (your browser should not show security warnings). Vercel handles SSL via Let’s Encrypt, so it should be automatic. You can also check on command line with curl -I https://bombay.chat to see the HTTP headers and verify a 200 OK and the presence of Vercel’s headers.

Ensure that requests from the domain go to the right place. Also test http://bombay.chat (without https) – it should redirect to https (Vercel typically forces HTTPS by default, and HSTS might be enabled).

If you set up a www CNAME, test http(s)://www.bombay.chat. If not used, ensure that is either parked or also redirects to the root domain via Porkbun’s redirect.

7. Post-Deployment Steps

- Monitoring: Now that the app is live, monitor logs and metrics. Vercel’s dashboard will show any function errors or logs from our application. Verify that no unexpected errors are appearing (e.g., auth callback errors, database errors, rate limit warnings).
- Security checks: Confirm that security headers are in place. Vercel by default sets some, but you might add a custom Security Headers config if needed. For instance, check in browser dev tools network panel for CSP or other headers. If our app needs a stricter CSP, we should configure it (see Security doc).
- Performance: The app should be fast (Vercel’s edge network serves static assets, and serverless functions run close to users). The first request to a cold function (especially the SSE route) might be slightly slower due to cold start, but subsequent calls will be warm.
- Domain email (optional): If needed, ensure no MX or other records were disturbed. (Likely not applicable unless we plan to send emails from @bombay.chat domain – currently we do not, since even NextAuth is using OAuth not email).
- Backups: Ensure you have a backup strategy for the database (Neon, Supabase usually have point-in-time or daily backups by default – verify that and enable as needed).

8. Deployment Flow Automation

For ongoing development:

- Auto-deploys: With the Vercel-GitHub integration, any push to main will trigger a new deployment. The CI/CD pipeline is essentially: push -> Vercel build -> deploy. If you use separate branches for staging, you can also have Vercel connected to a Preview branch.
- Migrations: When schema changes, include a Prisma migration file. For production, you might run prisma migrate deploy manually as needed. Alternatively, for simplicity, you could use db push in a pinch (not ideal for structured migration in production).
- Env changes: If you add a new env var (like enabling Sentry or a new provider key), remember to add it in Vercel before deploying the code expecting it.

By following this runbook, a developer or operator should be able to set up a fresh production environment or update the existing one confidently. (Reference: Production domain and hosting choices were outlined in the Design doc. We chose Vercel + custom domain for simplicity and speed. The steps above formalize that deployment).