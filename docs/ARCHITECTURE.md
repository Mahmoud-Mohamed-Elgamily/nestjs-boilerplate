# System Architecture

> **AI Context Document**: This document describes the current system architecture for AI-assisted development. Use this to understand the codebase structure, patterns, and technical decisions.

## Overview

**Framework**: NestJS v11 (Node.js/TypeScript)  
**Database**: PostgreSQL with TypeORM  
**Architecture Pattern**: Modular Monolith with Layered Architecture  
**API Style**: RESTful with Swagger/OpenAPI documentation  

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│         Presentation Layer (HTTP)           │
│  Controllers, Guards, Interceptors, Pipes   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Application Layer                 │
│     Services, Use Cases, Business Logic     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Data Access Layer                  │
│    Repositories, Entities, Migrations       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            Database (PostgreSQL)            │
└─────────────────────────────────────────────┘
```

## Module Structure

### Core Modules
- **AppModule**: Root module, imports global configuration
- **ConfigModule**: Environment configuration (global)
- **ThrottlerModule**: Rate limiting (global)
- **TypeOrmModule**: Database connection (global)

### Feature Modules
- **AuthModule**: Authentication, JWT, refresh tokens
- **UserModule**: User CRUD operations
- **HealthModule**: Health check endpoints

### Shared/Common
- **Logging**: Winston logger (src/common/logging/)
- **Filters**: Global exception filter (src/common/filters/)
- **Decorators**: Reusable decorators (src/common/decorators/)
- **DTOs**: Shared DTOs (src/common/dto/, shared/)
- **Guards**: Auth guards (src/common/guards/)

## Folder Structure

```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
├── app.controller.ts            # Root controller
├── base.entity.ts               # Base entity with common fields
├── crud.service.ts              # Generic CRUD service
│
├── migrations/                  # TypeORM migrations
│   └── [timestamp]-*.ts         # Migration files
│
├── common/                      # Shared code across modules
│   ├── decorators/              # Custom decorators
│   │   ├── api-response.decorator.ts  # Swagger response decorators
│   │   ├── current-user.decorator.ts  # Extract user from request
│   │   └── roles.decorator.ts         # Role metadata decorator
│   ├── dto/                     # Shared DTOs
│   │   └── api-response.dto.ts  # Standard API responses
│   ├── filters/                 # Exception filters
│   │   └── http-exception.filter.ts  # Global error handling
│   ├── guards/                  # Route guards
│   │   ├── jwt-auth.guard.ts    # JWT authentication
│   │   └── roles.guard.ts       # Role-based authorization
│   └── logging/                 # Logging configuration
│       └── logger.ts            # Winston logger setup
│
├── auth/                        # Authentication module
│   ├── auth.module.ts           # Module definition
│   ├── auth.controller.ts       # Auth endpoints
│   ├── auth.service.ts          # Auth business logic
│   ├── dto/                     # Auth DTOs
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── auth-response.dto.ts
│   ├── entities/                # Auth entities
│   │   └── refresh-token.entity.ts
│   └── strategies/              # Passport strategies
│       ├── jwt.strategy.ts      # JWT validation
│       └── jwt-refresh.strategy.ts  # Refresh token validation
│
├── user/                        # User module
│   ├── user.module.ts           # Module definition
│   ├── user.controller.ts       # User endpoints
│   ├── user.service.ts          # User business logic
│   ├── user.repository.ts       # User data access
│   ├── dto/                     # User DTOs
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/                # User entities
│       └── user.entity.ts
│
└── health/                      # Health check module
    ├── health.module.ts
    └── health.controller.ts

config/                          # TypeORM configuration
├── data-source.ts               # Migration data source
└── typeorm.config.ts            # TypeORM config

shared/                          # Shared utilities
├── pagination.dto.ts            # Pagination params
├── paginated-response.dto.ts    # Paginated responses
└── upload.helper.ts             # File upload utilities

docker/                          # Docker configuration
├── dockerfile                   # Application container
├── docker-compose.yml           # Multi-container setup
└── init.sql                     # Database initialization
```

## Database Schema

### Tables

#### users
```sql
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE
- password: VARCHAR(255)
- firstName: VARCHAR(100)
- lastName: VARCHAR(100)
- isEmailVerified: BOOLEAN
- isActive: BOOLEAN
- failedLoginAttempts: INTEGER
- accountLockedUntil: TIMESTAMP
- lastLoginAt: TIMESTAMP
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### refresh_tokens
```sql
- id: UUID (PK)
- token: VARCHAR(500) UNIQUE
- userId: UUID (FK -> users.id)
- expiresAt: TIMESTAMP
- isRevoked: BOOLEAN
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

**Relationships**:
- User → RefreshToken: One-to-Many (CASCADE DELETE)

### Indexes
- `users.email`: Unique index for fast email lookup
- `refresh_tokens.token`: Unique index for token validation
- `refresh_tokens.userId`: Index for user token queries

## Request Flow

### Typical Request Lifecycle

```
1. HTTP Request
   ↓
2. Middleware (Helmet, CORS, Rate Limiting)
   ↓
3. Global Pipes (Validation, Transformation)
   ↓
4. Guards (JWT Authentication, Roles)
   ↓
5. Interceptors (Logging, Response Transformation)
   ↓
6. Controller Method
   ↓
7. Service Layer (Business Logic)
   ↓
8. Repository/Entity (Data Access)
   ↓
9. Database Query
   ↓
10. Response Serialization
    ↓
11. Exception Filter (if error occurs)
    ↓
12. HTTP Response
```

## Design Patterns

### 1. Dependency Injection
- NestJS IoC container manages all dependencies
- Constructor-based injection for services, repositories
- Example: `constructor(private readonly userService: UserService)`

### 2. Repository Pattern
- Custom repositories extend TypeORM Repository
- Encapsulate data access logic
- Example: `UserRepository extends Repository<User>`

### 3. DTO Pattern
- Data Transfer Objects for request/response
- Class-based DTOs with decorators
- Validation via class-validator
- Example: `class CreateUserDto { @IsEmail() email: string }`

### 4. Decorator Pattern
- Custom decorators for cross-cutting concerns
- Examples: `@CurrentUser()`, `@Roles()`, `@ApiStandardResponse()`

### 5. Strategy Pattern
- Passport strategies for authentication
- JWT strategy, Refresh token strategy
- Pluggable authentication mechanisms

### 6. Filter Pattern
- Global exception filter for error handling
- Transforms exceptions to standardized responses

### 7. Guard Pattern
- Route protection via Guards
- JwtAuthGuard, RolesGuard
- Declarative security

## Configuration Management

### Environment Variables
Managed via `@nestjs/config` with `.env` file:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=Project_title

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Security
THROTTLE_TTL=60
THROTTLE_LIMIT=100
BCRYPT_ROUNDS=10
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=15
```

### Configuration Access
```typescript
// Inject ConfigService
constructor(private configService: ConfigService) {}

// Get config value with default
const port = this.configService.get<number>('PORT', 3000);
```

## Middleware Stack

### Global Middleware (Applied in main.ts)
1. **Helmet**: Security headers (CSP, HSTS, etc.)
2. **CORS**: Cross-origin resource sharing
3. **ValidationPipe**: Global request validation
4. **HttpExceptionFilter**: Global error handling

### Module-Level
- **ThrottlerGuard**: Rate limiting (APP_GUARD)
- **JwtAuthGuard**: Applied per-controller/route
- **RolesGuard**: Applied per-controller/route

## API Documentation

### Swagger/OpenAPI
- Endpoint: `/api` (in development)
- Auto-generated from decorators
- Custom decorators for standardization:
  - `@ApiStandardResponse(Model)`: Success responses
  - `@ApiErrorResponses(...errors)`: Error responses

### Response Format
```typescript
// Success (200-299)
{
  "statusCode": 200,
  "message": "Success message",
  "data": { /* actual data */ }
}

// Error (400-599)
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Database Management

### Migrations
```bash
# Generate migration from entity changes
npm run migration:generate src/migrations/MigrationName

# Create empty migration
npm run migration:create src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Auto-Migration on Startup
- Enabled via `migrationsRun: true` in TypeOrmModule
- Runs pending migrations automatically when app starts
- **Production**: Consider running migrations separately in deployment pipeline

## Error Handling

### Exception Filter Behavior
```typescript
// Development: Full error details
{
  "statusCode": 500,
  "message": "Detailed error message",
  "error": "Internal Server Error",
  "stack": "Error: ...\n    at ...",
  "timestamp": "...",
  "path": "/api/endpoint"
}

// Production: Sanitized errors
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "timestamp": "...",
  "path": "/api/endpoint"
}
```

### HTTP Status Code Usage
- `200`: Success (GET, PATCH)
- `201`: Created (POST)
- `204`: No Content (DELETE)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid auth)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

## Security Architecture

### Authentication
- **JWT Access Tokens**: Short-lived (1 hour), stateless
- **Refresh Tokens**: Long-lived (7 days), stored in database
- **Token Rotation**: New refresh token on each refresh
- **Token Revocation**: Database-backed, supports logout

### Authorization
- **Role-Based Access Control (RBAC)**: Via `@Roles()` decorator
- **Route Guards**: JwtAuthGuard + RolesGuard
- **User Roles**: Stored in User entity

### Security Features
- **Password Hashing**: Bcrypt (10 rounds)
- **Rate Limiting**: 100 requests/60 seconds (configurable)
- **Account Lockout**: 5 failed attempts → 15 minutes lockout
- **Security Headers**: Helmet.js (CSP, HSTS, X-Frame-Options)
- **CORS**: Configurable origins
- **Input Validation**: class-validator on all DTOs
- **SQL Injection**: Protected via TypeORM parameterized queries

## Logging

### Winston Logger
```typescript
// Log levels: error, warn, info, http, debug
logger.info('User logged in', { userId: user.id });
logger.error('Login failed', { email, error: err.message });
```

### Log Format
- **Development**: Colorized console output
- **Production**: JSON format for log aggregation

### What We Log
- Authentication events (login, logout, token refresh)
- Failed login attempts and account lockouts
- Validation errors
- Unhandled exceptions
- Critical security events

## Performance Considerations

### Database
- **Indexes**: On email, token, userId for fast lookups
- **Connection Pooling**: TypeORM manages connection pool
- **Query Optimization**: Use select, relations carefully

### Caching
- **Not Implemented**: Consider Redis for sessions/tokens in future

### Rate Limiting
- **In-Memory**: Current ThrottlerModule (not distributed)
- **Scalability**: Use Redis storage for multi-instance deployments

## Deployment Architecture

### Development
```
Local Machine
├── Node.js + NestJS (port 3000)
└── PostgreSQL (port 5432)
```

### Production (Recommended)
```
Load Balancer
├── App Instance 1 (Docker)
├── App Instance 2 (Docker)
└── App Instance N (Docker)
    ↓
PostgreSQL Cluster
├── Primary (Write)
└── Replicas (Read)
    ↓
Redis Cluster
└── Rate Limiting + Caching
```

## Scalability Path

### Current State: Single Instance
- ✅ Suitable for: 0-10,000 users
- ❌ Limitations: No horizontal scaling, in-memory rate limiting

### Phase 1: Multi-Instance
- Add Redis for rate limiting
- Use database-backed sessions
- Deploy multiple app instances behind load balancer

### Phase 2: Microservices (Optional)
- Split AuthModule into separate service
- Event-driven architecture with message queue
- API Gateway pattern

## Technology Stack

### Core
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: NestJS 11
- **ORM**: TypeORM 0.3+
- **Database**: PostgreSQL 14+

### Security
- **Authentication**: @nestjs/jwt, @nestjs/passport
- **Password Hashing**: bcrypt
- **Security Headers**: helmet
- **Rate Limiting**: @nestjs/throttler

### Validation & Transformation
- **Validation**: class-validator, class-transformer
- **API Docs**: @nestjs/swagger

### Logging
- **Logger**: winston, nest-winston

### Development
- **Testing**: Jest
- **Linting**: ESLint + @typescript-eslint
- **Formatting**: Prettier

## Key Architectural Decisions

### Why Modular Monolith?
- **Pros**: Simple deployment, shared database transactions, easier development
- **Migration Path**: Can extract modules to microservices later
- **Team Size**: Optimal for small-medium teams (1-10 developers)

### Why TypeORM?
- **Pros**: TypeScript-first, decorator-based, migrations support
- **Cons**: Less performant than Prisma/Drizzle for complex queries
- **Trade-off**: Developer experience > raw performance for CRUD apps

### Why JWT + Refresh Tokens?
- **Pros**: Stateless access tokens, revocable refresh tokens
- **Security**: Best practice for REST APIs
- **Alternative**: Session-based auth (more server resources)

### Why PostgreSQL?
- **Pros**: ACID compliance, JSON support, mature ecosystem
- **Use Case**: Relational data with complex queries
- **Alternative**: MongoDB for document-heavy workloads

## File Naming Conventions

```
entity:        user.entity.ts
dto:           create-user.dto.ts, update-user.dto.ts
controller:    user.controller.ts
service:       user.service.ts
repository:    user.repository.ts
module:        user.module.ts
guard:         jwt-auth.guard.ts
decorator:     current-user.decorator.ts
filter:        http-exception.filter.ts
migration:     1731246000000-AddAuthenticationTables.ts
```

## Common Code Patterns

### Creating a New Feature Module

```typescript
// 1. Generate module
nest g module feature
nest g controller feature
nest g service feature

// 2. Create entity
// feature/entities/feature.entity.ts
@Entity('features')
export class Feature extends BaseEntity {
  @Column()
  name: string;
}

// 3. Create DTOs
// feature/dto/create-feature.dto.ts
export class CreateFeatureDto {
  @IsString()
  @ApiProperty({ example: 'Feature name' })
  name: string;
}

// 4. Create service
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
  ) {}
  
  async findAll(): Promise<Feature[]> {
    return this.featureRepository.find();
  }
}

// 5. Create controller
@Controller('features')
@ApiTags('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}
  
  @Get()
  @ApiStandardResponse(Feature, { isArray: true })
  findAll() {
    return this.featureService.findAll();
  }
}

// 6. Register in module
@Module({
  imports: [TypeOrmModule.forFeature([Feature])],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService], // If other modules need it
})
export class FeatureModule {}
```

### Protected Routes

```typescript
// Require authentication
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}

// Require specific role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':id')
deleteUser(@Param('id') id: string) {
  return this.userService.remove(id);
}
```

### Pagination

```typescript
// Controller
@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  return this.service.findAll(paginationDto);
}

// Service
async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Entity>> {
  const { page = 1, limit = 10 } = paginationDto;
  const [data, total] = await this.repository.findAndCount({
    take: limit,
    skip: (page - 1) * limit,
  });
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock repositories/dependencies
- Location: `*.spec.ts` next to source file

### E2E Tests
- Test full request/response cycle
- Use test database
- Location: `test/` directory

### Running Tests
```bash
npm test              # Unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # E2E tests
```

## Next Steps for Scaling

1. **Add Redis**: For distributed rate limiting and caching
2. **Add Queue**: Bull/BullMQ for background jobs
3. **Add Monitoring**: Prometheus + Grafana
4. **Add Error Tracking**: Sentry for production errors
5. **Add Log Aggregation**: ELK stack or CloudWatch
6. **Database Replication**: Read replicas for scaling reads
7. **CDN**: For static assets
8. **API Gateway**: Kong or AWS API Gateway for multi-service architecture

---

**Last Updated**: November 10, 2025  
**Architecture Version**: 1.0  
**System Maturity**: 7.4/10 (Production-ready for standard applications)
