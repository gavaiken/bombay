export const runtime = 'nodejs'

import { prisma } from 'lib/prisma'
import { z } from 'zod'
import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'

const PatchSchema = z.object({ activeModel: z.string().min(1) })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: Request, context: any) {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const body = await request.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('VALIDATION_ERROR', 'activeModel required', 400, parsed.error.flatten())
    }
    const params = context?.params as { id: string }
    // ensure ownership
    const thread = await prisma.thread.findFirst({ where: { id: params.id, userId: gate.user.id } })
    if (!thread) return jsonError('NOT_FOUND', 'Thread not found', 404)

    const updated = await prisma.thread.update({
      where: { id: params.id },
      data: { activeModel: parsed.data.activeModel }
    })
    return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to update thread', 500)
  }
}
