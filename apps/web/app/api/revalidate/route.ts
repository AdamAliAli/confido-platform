import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const supplied = request.headers.get('x-revalidate-secret');
  // Fixed-size digests keep the comparison constant-time even for different lengths.
  const digest = (value: string) => createHash('sha256').update(value).digest();
  if (!secret || !supplied || !timingSafeEqual(digest(secret), digest(supplied))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidateTag('content');
  return Response.json({ ok: true });
}
