import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { xpToRank } from '@/lib/utils'

/**
 * Clerk webhook — syncs user creation/updates to Supabase.
 * Configure in Clerk dashboard: POST /api/webhooks/clerk
 * Events: user.created, user.updated
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret || webhookSecret.includes('placeholder')) {
    // Dev mode — skip verification
    return NextResponse.json({ received: true })
  }

  try {
    const payload = await req.json()
    const { type, data } = payload

    const supabase = createServiceClient()

    if (type === 'user.created') {
      const username =
        data.username ??
        data.email_addresses?.[0]?.email_address?.split('@')[0] ??
        `user_${data.id.slice(-8)}`

      await supabase.from('users').upsert({
        clerk_id:     data.id,
        username:     username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        display_name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || null,
        avatar_url:   data.image_url ?? null,
        xp:           0,
        rank_tier:    'ROOKIE',
        is_banned:    false,
      })
    }

    if (type === 'user.updated') {
      const updates: Record<string, unknown> = {}
      if (data.image_url) updates.avatar_url = data.image_url
      if (data.username)  updates.username   = data.username

      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('clerk_id', data.id)
      }
    }

    if (type === 'user.deleted') {
      // Soft-delete — mark as banned rather than deleting
      await supabase.from('users').update({ is_banned: true }).eq('clerk_id', data.id)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
