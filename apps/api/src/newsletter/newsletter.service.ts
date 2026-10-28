import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

function csvCell(value: string) {
  // Quoting alone does not prevent spreadsheet formulas in imported email cells.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string) {
    try { await this.prisma.subscriber.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase() },
      update: {},
    }); } catch (error) {
      // A concurrent subscription can win the unique-email insert race.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    }
    return { message: "Thanks, you're subscribed." };
  }

  list() {
    return this.prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async export() {
    const subscribers = await this.list();
    return ['email,createdAt', ...subscribers.map(({ email, createdAt }) =>
      `${csvCell(email)},${csvCell(createdAt.toISOString())}`,
    )].join('\r\n') + '\r\n';
  }

  async remove(id: string) {
    await this.prisma.subscriber.delete({ where: { id } });
    return { ok: true };
  }
}
