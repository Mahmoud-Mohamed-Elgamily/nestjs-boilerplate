import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createLogger } from './common/logging/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createLogger(),
  });

  const configService = app.get(ConfigService);

  // Security: Helmet
  app.use(helmet());

  // CORS configuration
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors (skip in test environment)
  if (process.env.NODE_ENV !== 'test') {
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
  }

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Project_title API')
    .setDescription('Project_title API Documentation - NestJS Boilerplate with JWT Authentication')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'test API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`
  ╔═════════════════════════════════════════════════════════════════════╗
  ║                                                                     
  ║   🚀 Application is running on: http://localhost:${port}            
  ║   📚 Swagger documentation: http://localhost:${port}/api/docs       
  ║   🏥 Health check: http://localhost:${port}/health                  
  ║                                                                     
  ║   Environment: ${process.env.NODE_ENV || 'development'}             
  ║                                                                     
  ╚═════════════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
