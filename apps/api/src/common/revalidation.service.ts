import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  async contentChanged(): Promise<void> {
    const webUrl = process.env.WEB_URL;
    const secret = process.env.REVALIDATE_SECRET;
    if (!webUrl || !secret) return;
    try {
      const response = await fetch(`${webUrl.replace(/\/+$/, '')}/api/revalidate`, {
        method: 'POST', headers: { 'x-revalidate-secret': secret },
        signal: AbortSignal.timeout(3000), redirect: 'error',
      });
      if (!response.ok) this.logger.warn(`Content revalidation failed (HTTP ${response.status}).`);
    } catch {
      // Never expose the secret or turn an already committed save into an error.
      this.logger.warn('Content revalidation failed or timed out.');
    }
  }
}
