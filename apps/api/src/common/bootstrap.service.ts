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
      { type: 'clarity', position: 3, data: {"heading":"Built on Clarity — Built to Scale","metrics":[{"label":"Strategic Partners","value":"98+","image":"https://framerusercontent.com/images/LtwdL5pxo7YbkmSPBJn6shHk9pw.png?width=2740&height=1683"},{"label":"Value Created","value":"200M","image":"https://framerusercontent.com/images/LtwdL5pxo7YbkmSPBJn6shHk9pw.png?width=2740&height=1683"},{"label":"Client Retention","value":"99%","image":"https://framerusercontent.com/images/LtwdL5pxo7YbkmSPBJn6shHk9pw.png?width=2740&height=1683"}]} },
      { type: 'location', position: 4, data: {"label":"MORE ABOUT US","placeLabel":"OUR PLACE","city":"Kuala Lumpur, Malaysia","country":"BASED IN MY","mapUrl":"https://maps.app.goo.gl/gvksn5TNcgMmMP2h7?g_st=ac","photos":[{"src":"https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SNDoO_lBBIlrFalSBp_X6jNKlLydmaGwt2ri9OfoGBkmWu25hrz5T6ULSRKDkY_4G9j6YeGk_rY4Z0-s36MqC_chObCHi9PjxAM5pvgOYP7k8IPEiNTEWwLLcXffo07klTF8Q=s1200-k-no","alt":"Confido brand identity workspace"},{"src":"/images/location/reference-forest.png","alt":"Sunlit forest landscape"},{"src":"/images/location/reference-traveler.png","alt":"Traveler walking through the city"}]} },
      { type: 'team', position: 5, data: {"label":"TEAM MEMBERS"} },
      { type: 'process', position: 6, data: {"steps":[{"step":"Step 1","title":"Discover","description":"We dive deep into your business, market, and gaps.","image":"/images/Process-1.avif"},{"step":"Step 2","title":"Define","description":"We build your positioning and strategic direction.","image":"/images/Process-2.avif"},{"step":"Step 3","title":"Design","description":"We translate strategy into a clear brand identity.","image":"/images/Process-3.avif"}]} },
      { type: 'faq', position: 7, data: {"faqs":[{"question":"What do you actually do?","answer":"We help businesses define their brand strategy, positioning, and direction before any design begins."},{"question":"Do you only work on design?","answer":"No. Design is the result. We focus on strategy first, then translate it into a clear brand system."},{"question":"How do we start working together?","answer":"We begin with a discovery call to understand your business, then define the right approach for your brand."},{"question":"How long does a project take?","answer":"It depends on the scope, but most projects range between 2–6 weeks."},{"question":"Who do you work with?","answer":"We work with businesses that are serious about building a strong and scalable brand."},{"question":"What makes Confido different?","answer":"We don’t start with design. We start with clarity — and build everything on top of it."}]} },
      { type: 'contact', position: 8, data: { title: 'Let’s Build Something', accent: 'That Lasts', description: 'We work with a limited number of clients to ensure clarity, focus, and real impact.', email: 'hello@confido.studio' } },
    ];
    const exists = await this.db.page.findUnique({ where: { slug: 'home' }, include: { blocks: true } });
    if (exists) {
      const canonical = defaultBlocks.map((block) => block.type);
      if (canonical.every((type) => exists.blocks.some((block) => block.type === type))) return;
      await this.db.$transaction(async (tx) => {
        const current = await tx.page.findUniqueOrThrow({ where: { id: exists.id }, include: { blocks: { orderBy: { position: 'asc' } } } });
        const blocks = [...current.blocks];
        let created = false;
        for (const block of defaultBlocks) {
          if (blocks.some((existing) => existing.type === block.type)) continue;
          const { _max } = await tx.block.aggregate({ where: { pageId: exists.id }, _max: { position: true } });
          blocks.push(await tx.block.create({ data: { ...block, pageId: exists.id, position: (_max.position ?? -1) + 1, enabled: true } }));
          created = true;
        }
        if (!created) return;
        // Stable sort keeps duplicates and unknown block types in their existing relative order.
        const rank = (type: string) => { const index = canonical.indexOf(type); return index < 0 ? canonical.length : index; };
        blocks.sort((a, b) => rank(a.type) - rank(b.type));
        const temporaryStart = Math.max(...blocks.map((block) => block.position), 0) + blocks.length + 1000;
        for (const [index, block] of blocks.entries()) {
          await tx.block.update({ where: { id: block.id }, data: { position: temporaryStart + index } });
        }
        for (const [index, block] of blocks.entries()) {
          await tx.block.update({ where: { id: block.id }, data: { position: index } });
        }
      }, { isolationLevel: 'Serializable' });
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
