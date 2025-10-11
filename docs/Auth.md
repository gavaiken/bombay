Google OAuth Authentication (NextAuth)

The application uses NextAuth (Auth.js) to handle authentication, configured with a Google OAuth 2.0 provider. This provides a simple “Sign in with Google” flow and manages user sessions securely. Here are the details and steps to configure Google auth:

1. Google API Console Setup: You need to create OAuth credentials in Google in order to obtain a Client ID and Client Secret:
- Go to the Google Cloud Console – Credentials (ensure you have a project created for this app).
- Click “Create Credentials” > “OAuth client ID”.
- Choose “Web Application” as the application type.
- Authorized JavaScript origins: add http://localhost:3000 for development (and your production domain e.g. https://bombay.chat for production).
- Authorized redirect URIs: add http://localhost:3000/api/auth/callback/google for dev and https://bombay.chat/api/auth/callback/google for production. NextAuth will redirect to this path after Google login.
- After creating, you will get a Client ID and Client Secret. Copy these.

2. NextAuth Configuration: In the code, NextAuth is configured in an API route (e.g., /api/auth/[...nextauth].ts). We use the Google provider with the credentials from above:

// pseudo-code for nextauth options
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: { /* ... (if any custom callbacks to attach userId, etc.) ... */ }
};

NextAuth handles the OAuth flow:
- When a user clicks "Sign in with Google", they are redirected to Google’s consent screen.
- Google provides an authentication code which NextAuth exchanges for the user’s profile (name, email, avatar).
- NextAuth then creates a session and sets a secure cookie.
- We configured NEXTAUTH_SECRET (an env variable) which is used to encrypt the session cookies and tokens. It should be a long, random string (at least 32 characters). This ensures session data integrity.

3. Session Model: NextAuth stores a session cookie (named next-auth.session-token by default) that contains an identifier to session data. In our setup, we use NextAuth’s default database-less session: session data is kept in an encrypted JWT (or in-memory on the server). The important part is the cookie:
- It is HTTP-only, Secure, and has SameSite=Lax by default. Lax means it won’t be sent on cross-site requests (mitigating CSRF) except for top-level navigations to our site (which is acceptable for OAuth redirects).
- The cookie contains the user’s session ID, which NextAuth uses to fetch the user object on each request.

4. User Account Data: When a user signs in with Google, NextAuth provides their Google profile info. We use the email from Google as the primary identifier. On first login, the backend will create a new User record in the database with that email (if not already present). There is no separate registration step – Google login is the only method and implicitly creates an account. We do not store Google tokens or any data beyond the email (and whatever minimal metadata NextAuth might keep in session). The User.email in our DB is unique, preventing duplicates. We do not ask for extensive scopes – just the basic profile and email from Google. By default, NextAuth’s GoogleProvider requests the userinfo.profile and userinfo.email scopes, which gives us the user’s name and email. We aren’t storing the name or avatar in our DB (not needed for functionality), although NextAuth might have it available in the session if needed for UI display (e.g., greeting the user by name).

5. Redirects and Session Flow: After successful Google authentication, NextAuth will redirect the user back to the app (by default to the homepage or where the sign-in was initiated from). In development on localhost, Google will redirect to localhost:3000. In production, it will redirect to our domain (bombay.chat). It’s important that the NEXTAUTH_URL environment variable is set to the correct base URL for production (e.g., https://bombay.chat) so that NextAuth knows its canonical URL when processing callbacks. In development, NextAuth can usually infer localhost:3000, but we set it explicitly in .env.local as well.

We have protected all application pages and API routes to require authentication:
- At the Next.js level, we use either a NextAuth middleware or guard logic to ensure a user is signed in. For example, our app directory layout might use await getServerSession() to check if the user is logged in and redirect to the sign-in page if not.
- All API routes check for session.user and return 401 if absent. This guarantees that no data is leaked to unauthenticated users.

6. Configuring in Production: In production (Vercel):
- Set the GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET in the Vercel project’s environment variables.
- Set NEXTAUTH_URL to https://bombay.chat (this is critical for NextAuth to generate correct callback URLs and for any email link scenarios).
- When deploying, ensure the OAuth consent screen is configured (for Google API Console, you might need to publish the OAuth consent if the app will be used outside of a single Google Workspace). For testing among a few users, you can add test users in Google Console to avoid publishing the app.

7. Sign Out and Session Duration: NextAuth provides a route for signing out (/api/auth/signout). In our UI, the user can log out, which clears the session cookie. The session cookie by default might be a session cookie (cleared on browser close) or have a fixed expiration as configured. We haven’t customized the session max age, so it defaults to NextAuth defaults (which is usually 30 days for the JWT session max age). The user will generally stay logged in unless they explicitly sign out or the cookie expires.

8. Security Considerations:
- We rely on Google for authentication, so password handling is entirely offloaded (more secure for us).
- The only user data we store is email, which is considered minimal PII. We do not store OAuth access or refresh tokens in our database. NextAuth may keep an in-memory token to fetch profile info, but we’re not using Google APIs beyond auth.
- The auth cookie is HTTP-only and Secure (on production) so it can’t be accessed by client-side scripts and will only be sent over HTTPS. SameSite=Lax helps mitigate CSRF by not sending the cookie on cross-site subrequests.
- We have set a strong NEXTAUTH_SECRET to sign/encrypt the session. This should never be exposed publicly.
- Ensure that the Google Client ID/Secret are kept private (only in server env variables). They are not exposed to the front-end; NextAuth only uses them on the server side during the OAuth exchange.

9. Testing Auth: During development, once your .env is set, you can test the sign-in flow:
- The first time, Google will ask you to consent to “View your profile info and email address”. After consenting, you should be redirected back as a logged-in user.
- The app should now allow you to see your threads and chat. In the dev logs or database, you should see a new User entry.
- On subsequent logins, NextAuth will recognize the email and not duplicate the user entry.
- If something goes wrong (e.g., redirect URI mismatch), double-check the URIs in Google Console and NEXTAUTH_URL. A common mistake is not including the /api/auth/callback/google in the authorized redirect list, or setting NEXTAUTH_URL incorrectly.

That’s it – with Google OAuth configured, the app manages user sessions seamlessly. We have a simple “Sign in with Google” button in the UI (or it auto-prompts if not signed in). All other parts of the app assume session.user.email is available and use the user’s ID/email to scope data.