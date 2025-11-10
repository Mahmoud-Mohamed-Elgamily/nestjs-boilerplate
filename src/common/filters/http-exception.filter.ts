import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '../../shared/response-types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        code = responseObj.error || exception.name;

        // Handle validation errors
        if (Array.isArray(responseObj.message)) {
          details = responseObj.message;
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name;

      // Log unexpected errors
      this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
    }

    // Don't leak sensitive information in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'Internal server error';
      details = undefined;
    } else if (statusCode === 500) {
      // In development, add more details
      details = {
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      };
    }

    const errorResponse: ApiError = {
      success: false,
      error: {
        code,
        message,
        statusCode,
        details,
      },
    };

    response.status(statusCode).json(errorResponse);
  }
}
