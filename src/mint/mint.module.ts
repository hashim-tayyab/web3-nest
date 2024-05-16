import { Module } from '@nestjs/common';
import { MintService } from './mint.service';
import { MintController } from './mint.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Mint, MintSchema } from './entities/mint.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: Mint.name, schema: MintSchema}])], 
  controllers: [MintController],
  providers: [MintService],
})
export class MintModule {}
