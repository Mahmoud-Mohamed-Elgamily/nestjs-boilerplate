import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'user' })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6789...',
    description: 'Refresh token for getting new access tokens',
  })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'newRefreshToken...',
    description: 'New refresh token',
  })
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}
