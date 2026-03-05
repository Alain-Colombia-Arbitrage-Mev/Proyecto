import { serverSupabaseServiceRole } from '#supabase/server'
import { ethers } from 'ethers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { address, signature, message } = body

  if (!address || !signature || !message) {
    throw createError({ statusCode: 400, message: 'address, signature and message are required' })
  }

  // Verify the signature matches the claimed address
  let recoveredAddress: string
  try {
    recoveredAddress = ethers.verifyMessage(message, signature)
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    throw createError({ statusCode: 401, message: 'Signature does not match address' })
  }

  // Verify the message contains a recent nonce (prevent replay attacks)
  const nonceMatch = message.match(/Nonce: (\d+)/)
  if (!nonceMatch) {
    throw createError({ statusCode: 400, message: 'Invalid message format' })
  }
  const nonce = parseInt(nonceMatch[1]!)
  const now = Date.now()
  if (Math.abs(now - nonce) > 5 * 60 * 1000) {
    throw createError({ statusCode: 401, message: 'Message expired' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const walletEmail = `${address.toLowerCase()}@wallet.focusflow.app`

  // Check if user already exists
  let userId: string | null = null
  let page = 1
  while (!userId) {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page, perPage: 500 })
    if (authErr) break
    const users = authData?.users || []
    const found = users.find((u: any) => u.email?.toLowerCase() === walletEmail)
    if (found) {
      userId = found.id
      break
    }
    if (users.length < 500) break
    page++
    if (page > 20) break
  }

  if (!userId) {
    // Create new user with wallet address as email
    const tempPassword = `wallet_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: walletEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        wallet_address: address.toLowerCase(),
        auth_provider: 'web3',
      },
    })
    if (createErr) {
      throw createError({ statusCode: 500, message: 'Error creating wallet user' })
    }
    userId = newUser.user.id
  }

  // Generate a session for the user
  // Use admin to generate a magic link token, then exchange it
  const { data: session, error: sessionErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: walletEmail,
  })

  if (sessionErr || !session) {
    throw createError({ statusCode: 500, message: 'Error generating session' })
  }

  return {
    userId,
    email: walletEmail,
    walletAddress: address.toLowerCase(),
    // Return the token_hash for the client to verify via Supabase
    tokenHash: session.properties?.hashed_token,
    verificationUrl: session.properties?.verification_url,
  }
})
