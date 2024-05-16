import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, now } from 'mongoose';

export type MintDocument = Mint & Document;

@Schema()
export class Mint {

  @Prop()
  to: string;

  @Prop()
  amount: number;

  @Prop({default: now()})
  createdAt: Date;

  @Prop({default: now()})
  updatedAt: Date;

}

export const MintSchema = SchemaFactory.createForClass(Mint);