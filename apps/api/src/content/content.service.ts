import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import {
  SUPPORTED_BLOCK_TYPES,
  UpdateBlockDto,
} from './dto';

const supportedTypes = [...SUPPORTED_BLOCK_TYPES];

@Injectable()
export class ContentService {
  constructor(private readonly db: PrismaService) {}

  async publicPage(slug: string) {
    const page = await this.db.page.findFirst({
      where: { slug, published: true },
      include: {
        blocks: {
          where: { enabled: true, type: { in: supportedTypes } },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException();
    }

    return page;
  }

  all() {
    return this.db.page.findMany({
      include: {
        blocks: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async order(pageId: string, ids: string[]) {
    return this.db.$transaction(async (tx) => {
      const page = await tx.page.findUnique({ where: { id: pageId }, include: { blocks: true } });
      if (!page) throw new NotFoundException();
      const pageIds = new Set(page.blocks.map((block) => block.id));
      if (ids.length !== pageIds.size || new Set(ids).size !== ids.length || ids.some((id) => !pageIds.has(id))) {
        throw new BadRequestException('ids must contain exactly this page’s blocks');
      }
      // Vacate the final positions before assigning the requested order.
      for (const [index, id] of ids.entries()) {
        await tx.block.update({ where: { id }, data: { position: 1000 + index } });
      }
      for (const [index, id] of ids.entries()) {
        await tx.block.update({ where: { id }, data: { position: index } });
      }
      return tx.page.findUnique({
        where: { id: pageId },
        include: { blocks: { orderBy: { position: 'asc' } } },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  update(id: string, dto: UpdateBlockDto) {
    if (Array.isArray(dto.data?.projects)) {
      for (const project of dto.data.projects) {
        if (
          !project || typeof project !== 'object' ||
          typeof project.href !== 'string' || !project.href.startsWith('https://') ||
          typeof project.image !== 'string' || !project.image.startsWith('https://')
        ) {
          throw new BadRequestException('Every project href and image must start with https://');
        }
      }
    }
    const data: Prisma.BlockUpdateInput = {
      enabled: dto.enabled,
      ...(dto.data === undefined
        ? {}
        : { data: dto.data as Prisma.InputJsonValue }),
    };

    return this.db.block.update({
      where: { id },
      data,
    });
  }

}
