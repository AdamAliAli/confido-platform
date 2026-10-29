import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateInquiryDto } from './dto';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInquiryDto) {
    if (dto.website !== undefined && dto.website !== null && dto.website !== '') return { ok: true };
    await this.prisma.inquiry.create({ data: {
      email: dto.email.toLowerCase(), phone: dto.phone?.trim() || null,
      interest: dto.interest, message: dto.message,
    } });
    return { ok: true };
  }

  list() { return this.prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' } }); }

  update(id: string, read: boolean) { return this.prisma.inquiry.update({ where: { id }, data: { read } }); }

  async remove(id: string) {
    await this.prisma.inquiry.delete({ where: { id } });
    return { ok: true };
  }
}
