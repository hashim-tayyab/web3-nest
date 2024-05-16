import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MintService } from './mint.service';
import { CreateMintDto } from './dto/create-mint.dto';
import { UpdateMintDto } from './dto/update-mint.dto';

@Controller('mint')
export class MintController {
  constructor(private readonly mintService: MintService) {}

  @Post()
  create(@Body() createMintDto: CreateMintDto) {
    return this.mintService.create(createMintDto);
  }

  @Get()
  findAll() {
    return this.mintService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mintService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMintDto: UpdateMintDto) {
    return this.mintService.update(+id, updateMintDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mintService.remove(+id);
  }
}
