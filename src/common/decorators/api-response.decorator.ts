import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

export function ApiStandardResponse<T extends Type<any>>(
  model: T,
  options?: {
    status?: number;
    description?: string;
    isArray?: boolean;
  },
) {
  const status = options?.status || 200;
  const description = options?.description || 'Successful response';
  const isArray = options?.isArray || false;

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: isArray
            ? {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              }
            : {
                $ref: getSchemaPath(model),
              },
        },
      },
    }),
  );
}

export function ApiErrorResponses(
  ...errors: Array<{ status: number; description: string; example?: string }>
) {
  return applyDecorators(
    ...errors.map((error) =>
      ApiResponse({
        status: error.status,
        description: error.description,
        schema: {
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: error.description.replace(/\s/g, ''),
                },
                message: {
                  type: 'string',
                  example: error.example || error.description,
                },
                statusCode: {
                  type: 'number',
                  example: error.status,
                },
              },
            },
          },
        },
      }),
    ),
  );
}
