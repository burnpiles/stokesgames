import { SignJWT, jwtVerify } from 'jose'
import type { ScoreToken } from '@/types'

const SECRET = new TextEncoder().encode(
  process.env.SCORE_TOKEN_SECRET ?? 'dev-secret-change-in-prod'
)

const TOKEN_TTL_SECONDS = 600  // 10 minutes

export async function mintScoreToken(
  payload: Omit<ScoreToken, 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(SECRET)
}

export async function verifyScoreToken(token: string): Promise<ScoreToken> {
  const { payload } = await jwtVerify(token, SECRET)
  return payload as unknown as ScoreToken
}
