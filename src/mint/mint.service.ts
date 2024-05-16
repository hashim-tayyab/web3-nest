import { Injectable } from '@nestjs/common';
import { CreateMintDto } from './dto/create-mint.dto';
import { UpdateMintDto } from './dto/update-mint.dto';
import { Mint, MintDocument } from './entities/mint.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';


@Injectable()
export class MintService {
  constructor(@InjectModel(Mint.name) private mintModel: Model<MintDocument>){}

  create(createMintDto: CreateMintDto) {
    const newMint = new this.mintModel(createMintDto);
    return newMint.save();
  }

  findAll() {
    return `This action returns all mint`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mint`;
  }

  update(id: number, updateMintDto: UpdateMintDto) {
    return `This action updates a #${id} mint`;
  }

  remove(id: number) {
    return `This action removes a #${id} mint`;
  }
}
