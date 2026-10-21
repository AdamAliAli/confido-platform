import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContentService } from './content.service';
import { UpdateBlockDto, UpdateOrderDto } from './dto';

@Controller('content')
export class ContentController {
  constructor(private readonly s: ContentService) {}

  @Get('public/:slug')
  publicPage(@Param('slug') slug: string) { return this.s.publicPage(slug); }

  @Get('admin/pages')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  all() { return this.s.all(); }

  @Patch('admin/pages/:id/order')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  order(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.s.order(id, dto.ids);
  }

  @Patch('admin/blocks/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  update(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.s.update(id, dto);
  }
}
