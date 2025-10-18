Prisma Schema and Database Structure

The bombay.chat application uses PostgreSQL as the database, accessed via Prisma ORM. The Prisma schema defines three models (User, Thread, Message) and one enum (Role). Below is the finalized Prisma schema for MVP with cascade cleanup and helpful indexes:

```prisma
// prisma/schema.prisma
_datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
_generator client { provider = "prisma-client-js" }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  threads   Thread[]
}

model Thread {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String?
  activeModel String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  messages    Message[]

  @@index([userId, updatedAt])
}

enum Role {
  system
  user
  assistant
}

model Message {
  id          String    @id @default(cuid())
  threadId    String
  thread      Thread    @relation(fields: [threadId], references: [id], onDelete: Cascade)
  role        Role
  contentText String
  provider    String?
  model       String?
  usageJson   Json?
  createdAt   DateTime  @default(now())

  @@index([threadId, createdAt])
}
```

Updates (Scopes):

- Added Thread.activeScopeKeys String[] with default [] (PostgreSQL array) to persist per-thread active scopes.
- Added ScopeConsent table (userId, threadId, scopeKey, grantedAt, revokedAt?) to track consent per sensitive scope.
- Added Message.metaJson Json? for storing attribution (usedScopes, sources) of recalled content.

Notes

- Cascade on User→Thread and Thread→Message prevents orphans when cleaning up test data.
- Keep message size limits enforced at API layer (see docs/API.md) to prevent bloat.
- Dev migrations: `npx prisma migrate dev`. Prod: `npx prisma migrate deploy` (or `db push` for MVP-only).
- Optional seed: create one user, 1–2 threads, and a few messages for smoke tests.
