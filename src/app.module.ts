import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsModule } from './transactions/transactions.module';
import { MintModule } from './mint/mint.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule global, so you don't need to import it in other modules
      envFilePath: '.env', // Path to your .env file
    }),
     MongooseModule.forRoot('mongodb://localhost/nest-indexer'), 
     TransactionsModule, 
     MintModule
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
