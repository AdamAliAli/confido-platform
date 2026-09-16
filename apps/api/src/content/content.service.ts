import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import {
  CreateBlockDto,
  CreatePageDto,
  SUPPORTED_BLOCK_TYPES,
  UpdateBlockDto,
} from './dto';

const supportedTypes = [...SUPPORTED_BLOCK_TYPES];

@Injectable()
export class ContentService {
  constructor(
    private readonly db: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async publicPage(slug: string) {
    const key = `page:${slug}`;
    const hit = await this.redis.client.get(key);

    if (hit) {
      return JSON.parse(hit);
    }

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

    await this.redis.client.set(key, JSON.stringify(page), 'EX', 60);
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

  async add(pageId: string, dto: CreateBlockDto) {
    const block = await this.db.block.create({
      data: {
        type: dto.type,
        position: dto.position,
        enabled: dto.enabled,
        data: dto.data as Prisma.InputJsonValue,
        pageId,
      },
    });

    await this.clear(pageId);
    return block;
  }

  async update(id: string, dto: UpdateBlockDto) {
    const data: Prisma.BlockUpdateInput = {
      position: dto.position,
      enabled: dto.enabled,
      ...(dto.data === undefined
        ? {}
        : { data: dto.data as Prisma.InputJsonValue }),
    };

    const block = await this.db.block.update({
      where: { id },
      data,
    });

    await this.clear(block.pageId);
    return block;
  }

  async remove(id: string) {
    const block = await this.db.block.delete({ where: { id } });
    await this.clear(block.pageId);
    return { deleted: true };
  }

  async publish(id: string) {
    const page = await this.db.page.update({
      where: { id },
      data: { published: true },
    });

    await this.redis.client.del(`page:${page.slug}`);
    return page;
  }

  private async clear(pageId: string) {
    const page = await this.db.page.findUnique({ where: { id: pageId } });

    if (page) {
      await this.redis.client.del(`page:${page.slug}`);
    }
  }
}
