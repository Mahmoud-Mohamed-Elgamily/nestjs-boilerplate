import { Injectable } from '@nestjs/common';
import { CrudService } from 'src/crud.service';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService extends CrudService<User> {
  constructor(
    @InjectRepository(User)
    protected readonly repo: Repository<User>,
  ) {
    super(repo);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    await this.repo.increment({ id: userId }, 'failedLoginAttempts', 1);
  }

  async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.repo.update({ id: userId }, { failedLoginAttempts: 0, lockedUntil: null });
  }

  async lockAccount(userId: string, lockDurationMinutes: number = 15): Promise<void> {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDurationMinutes);
    await this.repo.update({ id: userId }, { lockedUntil });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repo.update({ id: userId }, { lastLoginAt: new Date() });
  }
}
