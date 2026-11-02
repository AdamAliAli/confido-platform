import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../common/prisma.service';
import { GalleryCreateDto, GalleryEditDto, GalleryOrderDto } from './dto';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  list(admin = false) {
    return this.prisma.galleryItem.findMany({
      where: admin ? {} : { enabled: true }, orderBy: [{ section: 'asc' }, { position: 'asc' }],
      ...(admin ? {} : { select: { id: true, section: true, mediaType: true, publicId: true, title: true, client: true, category: true, width: true, height: true } }),
    });
  }

  async create(dto: GalleryCreateDto) {
    // Two upload workers can finish together. Retry a conflicting position allocation.
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(async tx => {
          const max = await tx.galleryItem.aggregate({ where: { section: dto.section }, _max: { position: true } });
          return tx.galleryItem.create({ data: { ...dto, position: (max._max.position ?? -1) + 1 } });
        }, { isolationLevel: 'Serializable' });
      } catch (error) {
        if (attempt >= 3 || !['P2002', 'P2034'].includes((error as { code?: string }).code || '')) throw error;
      }
    }
  }

  update(id: string, dto: GalleryEditDto) { return this.prisma.galleryItem.update({ where: { id }, data: dto }); }

  order({ section, ids }: GalleryOrderDto) {
    return this.prisma.$transaction(async tx => {
      const items = await tx.galleryItem.findMany({ where: { section } });
      if (ids.length !== items.length || new Set(ids).size !== ids.length || ids.some(id => !items.some(item => item.id === id))) {
        throw new BadRequestException('IDs must be exactly the items in this section.');
      }
      const offset = Math.max(1000, ...items.map(item => item.position + 1));
      for (const [index, id] of ids.entries()) await tx.galleryItem.update({ where: { id }, data: { position: offset + index } });
      for (const [index, id] of ids.entries()) await tx.galleryItem.update({ where: { id }, data: { position: index } });
      return { ok: true };
    });
  }

  async remove(id: string) {
    const item = await this.prisma.galleryItem.findUniqueOrThrow({ where: { id } });
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret) throw new ServiceUnavailableException('Cloudinary deletion is not configured.');
    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary requires every supplied non-file parameter (including invalidate) to be signed.
    const signature = createHash('sha1').update(`invalidate=true&public_id=${item.publicId}&timestamp=${timestamp}${secret}`).digest('hex');
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/${item.mediaType}/destroy`, {
        method: 'POST', body: new URLSearchParams({ public_id: item.publicId, timestamp: String(timestamp), api_key: key, signature, invalidate: 'true' }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || !['ok', 'not found'].includes(result.result)) throw new Error('Deletion failed');
    } catch { throw new BadGatewayException('Unable to delete the Cloudinary asset. Please try again.'); }
    await this.prisma.galleryItem.delete({ where: { id } });
    return { ok: true };
  }
}
