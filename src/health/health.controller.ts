import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      example: {
        success: true,
        data: {
          status: 'ok',
          uptime: 12345,
          timestamp: '2025-11-02T12:00:00.000Z',
        },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
