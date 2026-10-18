import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class TeamService {
  constructor(private readonly db: PrismaService) {}

  findAll() {
    return this.db.teamMember.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  create(dto: CreateTeamMemberDto) {
    return this.db.teamMember.create({ data: dto });
  }

  update(id: string, dto: UpdateTeamMemberDto) {
    return this.db.teamMember.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.db.teamMember.delete({ where: { id } });
    return { deleted: true };
  }
}
