import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccess } from '../../shared/response-types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data) => {
        // If response already has success property, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap successful response
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
