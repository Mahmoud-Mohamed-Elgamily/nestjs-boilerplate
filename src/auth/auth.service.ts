import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserService } from '../user/user.service';
import { RefreshToken } from './entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MINUTES = 15;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      this.logger.warn(`Failed login attempt for non-existent user: ${email}`);
      return null;
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - new Date().getTime()) / (1000 * 60),
      );
      this.logger.warn(
        `Login attempt for locked account: ${email}. Locked for ${remainingMinutes} more minutes`,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${remainingMinutes} minutes`,
      );
    }

    // Check if account is active
    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive account: ${email}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.userService.incrementFailedLoginAttempts(user.id);

      const updatedUser = await this.userService.findByEmail(email);
      const remainingAttempts = MAX_FAILED_LOGIN_ATTEMPTS - updatedUser.failedLoginAttempts;

      this.logger.warn(
        `Failed login attempt for user: ${email}. Attempts: ${updatedUser.failedLoginAttempts}/${MAX_FAILED_LOGIN_ATTEMPTS}`,
      );

      // Lock account if max attempts reached
      if (updatedUser.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        await this.userService.lockAccount(user.id, ACCOUNT_LOCK_DURATION_MINUTES);
        this.logger.warn(`Account locked due to too many failed attempts: ${email}`);
        throw new UnauthorizedException(
          `Account locked for ${ACCOUNT_LOCK_DURATION_MINUTES} minutes due to too many failed login attempts`,
        );
      }

      throw new UnauthorizedException(
        `Invalid credentials. ${remainingAttempts} attempts remaining`,
      );
    }

    // Reset failed login attempts on successful password verification
    await this.userService.resetFailedLoginAttempts(user.id);

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login timestamp
    await this.userService.updateLastLogin(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    this.logger.log(`User logged in successfully: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);

    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${registerDto.email}`);
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user in database
    const newUser = await this.userService.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      role: 'user',
      isActive: true,
      isEmailVerified: false, // Email verification can be implemented later
      failedLoginAttempts: 0,
    });

    this.logger.log(`New user registered: ${newUser.email}`);

    // Generate tokens
    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(newUser.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  }

  async refreshAccessToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // Find refresh token in database
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!tokenRecord) {
      this.logger.warn(`Invalid or expired refresh token used`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Check if user is still active
    if (!tokenRecord.user.isActive) {
      this.logger.warn(`Refresh token used for inactive account: ${tokenRecord.user.email}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Revoke old token (token rotation)
    tokenRecord.isRevoked = true;
    tokenRecord.revokedAt = new Date();

    // Generate new tokens
    const payload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

    // Store reference to new token
    tokenRecord.replacedByToken = newRefreshToken;
    await this.refreshTokenRepository.save(tokenRecord);

    this.logger.log(`Tokens refreshed for user: ${tokenRecord.user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    // Revoke all refresh tokens for this user
    if (refreshToken) {
      await this.refreshTokenRepository.update(
        { userId, token: refreshToken },
        { isRevoked: true, revokedAt: new Date() },
      );
      this.logger.log(`Refresh token revoked for user: ${userId}`);
    } else {
      // Revoke all user's refresh tokens
      await this.refreshTokenRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() },
      );
      this.logger.log(`All refresh tokens revoked for user: ${userId}`);
    }

    return { message: 'Logged out successfully' };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return token;
  }

  async cleanupExpiredTokens() {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: MoreThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected || 0} expired refresh tokens`);
  }
}
