import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamService } from './team.service';
import { RevalidationService } from '../common/revalidation.service';

@Controller('team')
export class TeamController {
  constructor(private readonly service: TeamService, private readonly revalidation: RevalidationService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async create(@Body() dto: CreateTeamMemberDto) {
    const result = await this.service.create(dto);
    await this.revalidation.contentChanged();
    return result;
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    const result = await this.service.update(id, dto);
    await this.revalidation.contentChanged();
    return result;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    await this.revalidation.contentChanged();
    return result;
  }
}
