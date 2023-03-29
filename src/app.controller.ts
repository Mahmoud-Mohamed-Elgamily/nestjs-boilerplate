import { Controller, Get } from '@nestjs/common';
import { CrudService } from './crud.service';

@Controller()
export class AppController {
  constructor(private readonly appService: CrudService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
