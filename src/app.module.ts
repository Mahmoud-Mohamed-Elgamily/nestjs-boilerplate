import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CrudService } from './crud.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ormConfig } from 'config/typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig), UserModule],

  controllers: [AppController],
  providers: [],
})
export class AppModule {}
