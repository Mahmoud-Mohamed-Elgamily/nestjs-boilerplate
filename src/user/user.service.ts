import { Injectable } from '@nestjs/common';
import { CrudService } from 'src/crud.service';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService extends CrudService<User>{
  
  constructor(
    @InjectRepository(User)
    protected readonly repo: Repository<User>,
   ) {
    super(repo);
  }
 
}
