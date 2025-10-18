import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_USER_EMAIL || 'dev@example.com'
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email }
  })
  const thread = await prisma.thread.create({
    data: {
      userId: user.id,
      title: 'Sample thread',
      activeModel: 'openai:gpt-4o'
    }
  })
  await prisma.message.createMany({
    data: [
      { threadId: thread.id, role: 'user', contentText: 'Hello' },
      { threadId: thread.id, role: 'assistant', contentText: 'Hi there! This is a seeded message.', provider: 'openai', model: 'gpt-4o' }
    ]
  })

  // Scopes sample data (dev only): simple tagged notes to exercise recall/redaction
  const scopesThread = await prisma.thread.create({
    data: {
      userId: user.id,
      title: 'Scopes Sample',
      activeModel: 'openai:gpt-4o'
    }
  })
  await prisma.message.createMany({
    data: [
      { threadId: scopesThread.id, role: 'user', contentText: 'Add some notes for later' },
      { threadId: scopesThread.id, role: 'assistant', contentText: '[Work] Meeting at 2 PM with ACME. Zoom link in calendar.', provider: 'openai', model: 'gpt-4o' },
      { threadId: scopesThread.id, role: 'assistant', contentText: '[Personal] Buy a gift for mom', provider: 'openai', model: 'gpt-4o' },
      { threadId: scopesThread.id, role: 'assistant', contentText: '[Health] BP reading 120/80 today (mask names & exact locations).', provider: 'openai', model: 'gpt-4o' }
    ]
  })

  console.log('Seeded:', { user: user.email, thread: thread.id, scopesThread: scopesThread.id })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})