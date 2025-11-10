import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;
}

export class ApiErrorResponse {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      code: { type: 'string', example: 'UnauthorizedException' },
      message: { type: 'string', example: 'Invalid credentials' },
      statusCode: { type: 'number', example: 401 },
    },
  })
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

// Helper function to create typed success responses for Swagger
export function createApiSuccessResponse<T>(
  type: new () => T,
  description: string,
  status: number = 200,
) {
  return {
    status,
    description,
    type,
  };
}

// Helper function to create error responses for Swagger
export function createApiErrorResponse(
  description: string,
  status: number,
  exampleMessage: string,
  exampleCode?: string,
) {
  return {
    status,
    description,
    schema: {
      example: {
        success: false,
        error: {
          code: exampleCode || `${description.replace(/\s/g, '')}Exception`,
          message: exampleMessage,
          statusCode: status,
        },
      },
    },
  };
}
