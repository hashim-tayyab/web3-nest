import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, now } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema()
export class Transaction {
  @Prop()
  from: string;

  @Prop()
  to: string;

  @Prop()
  transactionHash: string;

  @Prop()
  amount: number;

  @Prop({default: now()})
  createdAt: Date;

  @Prop({default: now()})
  updatedAt: Date;

}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);