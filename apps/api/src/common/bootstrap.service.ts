import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from './prisma.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(private readonly db: PrismaService) {}

  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL?.toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password && password.length >= 12) {
      await this.db.user.upsert({ where: { email }, update: {}, create: { email, passwordHash: await argon2.hash(password), role: 'ADMIN' } });
    }

    const defaultBlocks: Prisma.BlockCreateWithoutPageInput[] = [
      { type: 'hero', position: 0, data: { eyebrow: 'Strategic brand consultancy', title: 'Brands', accent: 'With', subtitle: 'Direction', description: 'Confido helps businesses build clear positioning, strong direction, and scalable brand systems.' } },
      { type: 'services', position: 1, data: { services: [{ title: 'Strategy', description: 'Clarity before everything.' }, { title: 'Positioning', description: 'Stand for something or disappear.' }, { title: 'Systems', description: 'Built to scale, not just look good.' }] } },
      { type: 'projects', position: 2, data: { projects: [] } },
      { type: 'clarity', position: 3, data: {} },
    ];
    const exists = await this.db.page.findUnique({ where: { slug: 'home' }, include: { blocks: true } });
    if (exists) {
      const existingTypes = new Set(exists.blocks.map((block) => block.type));
      for (const block of defaultBlocks) {
        if (existingTypes.has(block.type)) continue;
        const { _max } = await this.db.block.aggregate({
          where: { pageId: exists.id },
          _max: { position: true },
        });
        await this.db.block.create({
          data: { ...block, pageId: exists.id, position: (_max.position ?? -1) + 1, enabled: true },
        });
      }
      return;
    }
    await this.db.page.create({
      data: {
        slug: 'home', title: 'Confido', published: true,
        blocks: { create: defaultBlocks },
      },
    });
  }
}
