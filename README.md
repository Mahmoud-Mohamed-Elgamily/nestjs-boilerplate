# Project_title - NestJS Boilerplate API

A production-ready NestJS boilerplate with JWT authentication, security hardening, standardized API responses, and comprehensive Swagger documentation.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication with role-based access control
- 🛡️ **Security Hardening** - Helmet, CORS, rate limiting, and input validation
- 📦 **Standardized Responses** - Consistent API response format for success and error cases
- 📚 **Swagger Documentation** - Interactive API documentation at `/api/docs`
- ✅ **Validation** - Global validation and transformation using class-validator
- 🏥 **Health Checks** - Built-in health check endpoint
- 📝 **Structured Logging** - Winston logger with JSON format support
- 🚀 **Production Ready** - Clean architecture and best practices

## Tech Stack

- **Framework**: NestJS v11
- **Language**: TypeScript
- **Database**: TypeORM (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator & class-transformer
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# JWT Authentication
JWT_SECRET=supersecret_change_me
JWT_EXPIRES_IN=1h

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Database (existing)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=root
DB_NAME=sportify
```

> ⚠️ **Important**: Change `JWT_SECRET` to a secure random string in production!

## Installation

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The application will start on `http://localhost:3000` (or the PORT specified in `.env`)

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

The Swagger UI provides:
- Interactive API testing
- Request/response schemas
- JWT authentication support
- Comprehensive endpoint documentation

## API Endpoints

### Authentication

- `POST /auth/login` - User login (returns JWT token)
- `POST /auth/register` - User registration (returns JWT token)

### Users

- `GET /users/profile` - Get current user profile (requires JWT)
- `GET /users` - List all users (public)
- `GET /users/:id` - Get user by ID (public)
- `POST /users` - Create user (public)
- `PATCH /users/:id` - Update user (requires JWT)
- `DELETE /users/:id` - Delete user (requires JWT)

### Health

- `GET /health` - Health check endpoint

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    // Optional metadata
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "statusCode": 400,
    "details": {
      // Optional error details
    }
  }
}
```

## Authentication

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

### Using JWT Token

Include the token in the Authorization header for protected endpoints:

```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

### Rate Limiting

- Default: 100 requests per 60 seconds
- Auth endpoints: 5 login attempts per minute, 3 registration attempts per minute
- Configurable via environment variables

### CORS

- Configurable allowed origins via `CORS_ORIGINS`
- Credentials support enabled

### Helmet

- Security headers automatically applied
- XSS protection, clickjacking prevention, etc.

### Input Validation

- Automatic validation using class-validator
- Whitelist mode (strips unknown properties)
- Transform mode (automatic type conversion)

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── decorators/         # Custom decorators (Public, Roles)
│   ├── dto/                # DTOs for auth
│   ├── guards/             # JWT and Roles guards
│   ├── strategies/         # Passport JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── common/                  # Shared utilities
│   ├── filters/            # Global exception filters
│   ├── interceptors/       # Response interceptors
│   └── logging/            # Winston logger configuration
├── health/                  # Health check module
├── user/                    # User module
├── shared/                  # Shared types and DTOs
│   ├── response-types.ts   # API response types
│   ├── pagination.dto.ts
│   └── upload.helper.ts
├── app.module.ts
└── main.ts                  # Application entry point
```

## TODO / Future Enhancements

- [ ] Integrate real user database with password hashing
- [ ] Add refresh token mechanism
- [ ] Add logout endpoint
- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Add more comprehensive logging
- [ ] Add metrics and monitoring
- [ ] Add database migrations
- [ ] Add Docker support improvements

## License

This project is [MIT licensed](LICENSE).

## Support

For issues and questions, please open an issue on the repository.

# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
