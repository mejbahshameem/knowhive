import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    // ConfigModule loads .env file and makes env vars injectable
    ConfigModule.forRoot({
      isGlobal: true, // Available everywhere, no need to import per module
      envFilePath: '../../.env', // Root .env file (monorepo)
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
