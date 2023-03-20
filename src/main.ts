import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.NESTJS_APP_LOCAL_PORT);
  console.log(`listining on port ${process.env.NESTJS_APP_LOCAL_PORT}`);
}
bootstrap();
