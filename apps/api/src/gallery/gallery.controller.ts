import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RevalidationService } from '../common/revalidation.service';
import { GalleryCreateDto, GalleryEditDto, GalleryOrderDto } from './dto';
import { GalleryService } from './gallery.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly service: GalleryService, private readonly revalidation: RevalidationService) {}
  @Get() list() { return this.service.list(); }
  @Get('admin') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('ADMIN', 'EDITOR')
  admin() { return this.service.list(true); }
  @Post() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('ADMIN', 'EDITOR')
  async create(@Body() dto: GalleryCreateDto) { const result = await this.service.create(dto); await this.revalidation.contentChanged(); return result; }
  @Patch('order') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('ADMIN', 'EDITOR')
  async order(@Body() dto: GalleryOrderDto) { const result = await this.service.order(dto); await this.revalidation.contentChanged(); return result; }
  @Patch(':id') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('ADMIN', 'EDITOR')
  async update(@Param('id') id: string, @Body() dto: GalleryEditDto) { const result = await this.service.update(id, dto); await this.revalidation.contentChanged(); return result; }
  @Delete(':id') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('ADMIN')
  async remove(@Param('id') id: string) { const result = await this.service.remove(id); await this.revalidation.contentChanged(); return result; }
}
