import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import {
  CreateBlockDto,
  CreatePageDto,
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
          where: { type: { in: supportedTypes } },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  createPage(dto: CreatePageDto) {
    return this.db.page.create({ data: dto });
  }

  add(pageId: string, dto: CreateBlockDto) {
    return this.db.block.create({
      data: {
        type: dto.type,
        position: dto.position,
        enabled: dto.enabled,
        data: dto.data as Prisma.InputJsonValue,
        pageId,
      },
    });
  }

  update(id: string, dto: UpdateBlockDto) {
    const data: Prisma.BlockUpdateInput = {
      position: dto.position,
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

  async remove(id: string) {
    await this.db.block.delete({ where: { id } });
    return { deleted: true };
  }

  publish(id: string) {
    return this.db.page.update({
      where: { id },
      data: { published: true },
    });
  }
}
