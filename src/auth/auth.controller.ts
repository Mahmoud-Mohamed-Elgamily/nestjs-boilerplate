import { Controller, Post, Body, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, RefreshResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiStandardResponse,
  ApiErrorResponses,
} from '../common/decorators/api-response.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'User login' })
  @ApiStandardResponse(AuthResponseDto, {
    status: 200,
    description: 'Login successful',
  })
  @ApiErrorResponses(
    { status: 401, description: 'Unauthorized', example: 'Invalid email or password' },
    { status: 429, description: 'Too Many Requests', example: 'Rate limit exceeded' },
  )
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'User registration' })
  @ApiStandardResponse(AuthResponseDto, {
    status: 201,
    description: 'Registration successful',
  })
  @ApiErrorResponses(
    { status: 400, description: 'Bad Request', example: 'Invalid input data' },
    { status: 409, description: 'Conflict', example: 'User with this email already exists' },
    { status: 429, description: 'Too Many Requests', example: 'Rate limit exceeded' },
  )
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiStandardResponse(RefreshResponseDto, {
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiErrorResponses(
    { status: 401, description: 'Unauthorized', example: 'Invalid or expired refresh token' },
    { status: 429, description: 'Too Many Requests', example: 'Rate limit exceeded' },
  )
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and revoke refresh tokens' })
  @ApiStandardResponse(LogoutResponseDto, {
    status: 200,
    description: 'Logged out successfully',
  })
  @ApiErrorResponses({
    status: 401,
    description: 'Unauthorized',
    example: 'Invalid or missing token',
  })
  async logout(@Request() req, @Body() body?: { refreshToken?: string }) {
    return this.authService.logout(req.user.sub, body?.refreshToken);
  }
}
