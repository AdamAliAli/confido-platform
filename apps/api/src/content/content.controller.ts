import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContentService } from './content.service';
import { UpdateBlockDto, UpdateOrderDto } from './dto';
import { RevalidationService } from '../common/revalidation.service';

@Controller('content')
export class ContentController {
  constructor(private readonly s: ContentService, private readonly revalidation: RevalidationService) {}

  @Get('public/:slug')
  publicPage(@Param('slug') slug: string) { return this.s.publicPage(slug); }

  @Get('admin/pages')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  all() { return this.s.all(); }

  @Patch('admin/pages/:id/order')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async order(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    const result = await this.s.order(id, dto.ids);
    await this.revalidation.contentChanged();
    return result;
  }

  @Patch('admin/blocks/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async update(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    const result = await this.s.update(id, dto);
    await this.revalidation.contentChanged();
    return result;
  }
}
