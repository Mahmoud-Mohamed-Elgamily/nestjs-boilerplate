# Coding Style Guide

> **AI Context Document**: This document defines the coding standards for this project. Use this to generate consistent, maintainable code that follows team conventions. All rules align with `.prettierrc` and `.eslintrc.js` configurations.

## Quick Reference

### File Creation Template
```typescript
// 1. Imports (grouped and sorted)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateEntityDto } from './dto/create-entity.dto';
import { Entity } from './entities/entity.entity';

// 2. Class with decorator
@Injectable()
export class EntityService {
  // 3. Constructor with DI
  constructor(
    @InjectRepository(Entity)
    private readonly entityRepository: Repository<Entity>,
  ) {}

  // 4. Methods with clear return types
  async findAll(): Promise<Entity[]> {
    return this.entityRepository.find();
  }
}
```

### Common Patterns
```typescript
// ✅ DO: Use async/await
async findOne(id: string): Promise<Entity> {
  return await this.repository.findOne({ where: { id } });
}

// ❌ DON'T: Use .then() chains
findOne(id: string): Promise<Entity> {
  return this.repository.findOne({ where: { id } }).then(entity => entity);
}

// ✅ DO: Use explicit return types
async create(dto: CreateDto): Promise<Entity> { }

// ❌ DON'T: Rely on type inference for public methods
async create(dto: CreateDto) { }

// ✅ DO: Use readonly for injected dependencies
constructor(private readonly service: Service) {}

// ❌ DON'T: Use mutable dependencies
constructor(private service: Service) {}
```

## Formatting Rules (Prettier)

### Configuration
All rules are enforced by Prettier (`.prettierrc`):

```json
{
  "singleQuote": true,           // Use 'single' not "double"
  "trailingComma": "all",        // Add trailing commas everywhere
  "arrowParens": "always",       // Always wrap arrow function params
  "tabWidth": 2,                 // 2 spaces for indentation
  "printWidth": 100,             // Line length limit
  "semi": true,                  // Always use semicolons
  "bracketSpacing": true,        // { spacing } in objects
  "endOfLine": "lf"              // Unix line endings
}
```

### String Quotes
```typescript
// ✅ DO: Use single quotes
const message = 'Hello world';
import { Module } from '@nestjs/common';

// ❌ DON'T: Use double quotes
const message = "Hello world";

// ✅ Exception: Template literals for interpolation
const greeting = `Hello ${name}`;
```

### Trailing Commas
```typescript
// ✅ DO: Add trailing commas
const array = [
  'item1',
  'item2',
  'item3',  // <-- trailing comma
];

const object = {
  key1: 'value1',
  key2: 'value2',  // <-- trailing comma
};

function myFunc(
  param1: string,
  param2: number,  // <-- trailing comma
) {}

// ❌ DON'T: Omit trailing commas
const array = [
  'item1',
  'item2',
  'item3'  // <-- missing
];
```

### Arrow Functions
```typescript
// ✅ DO: Always use parentheses
const square = (x) => x * x;
const identity = (value) => value;

// ❌ DON'T: Omit parentheses
const square = x => x * x;

// Multiple parameters (parentheses required anyway)
const add = (a, b) => a + b;
```

### Line Length
```typescript
// ✅ DO: Keep lines under 100 characters
const result = await this.service.findOne(id, {
  relations: ['author', 'comments'],
});

// ❌ DON'T: Exceed 100 characters
const result = await this.service.findOne(id, { relations: ['author', 'comments', 'tags', 'likes'] });

// ✅ DO: Break long chains
const users = await this.repository
  .createQueryBuilder('user')
  .where('user.isActive = :isActive', { isActive: true })
  .orderBy('user.createdAt', 'DESC')
  .getMany();
```

### Semicolons
```typescript
// ✅ DO: Always use semicolons
const value = 10;
import { Module } from '@nestjs/common';

// ❌ DON'T: Omit semicolons
const value = 10
import { Module } from '@nestjs/common'
```

### Object/Array Spacing
```typescript
// ✅ DO: Add space inside braces
const obj = { key: 'value' };
const { id, name } = user;

// ❌ DON'T: Omit spacing
const obj = {key: 'value'};
const {id, name} = user;

// Arrays don't have spacing
const arr = [1, 2, 3];  // ✅
const arr = [ 1, 2, 3 ];  // ❌
```

## Import Organization

### Import Order (Auto-sorted)
```typescript
// 1. NestJS imports
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// 2. Internal aliases (@/)
import { CurrentUser } from '@/common/decorators/current-user.decorator';

// 3. Third-party libraries
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// 4. Relative imports
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
```

**Rule**: Separated by blank lines, sorted alphabetically within groups

### Import Styles
```typescript
// ✅ DO: Named imports for specific items
import { Injectable, NotFoundException } from '@nestjs/common';

// ✅ DO: Namespace import for many items
import * as bcrypt from 'bcrypt';

// ✅ DO: Default import when appropriate
import helmet from 'helmet';

// ❌ DON'T: Mix default and named without reason
import express, { Request, Response } from 'express';  // OK if needed
import express from 'express';
import { Request, Response } from 'express';  // Better: separate lines
```

## Naming Conventions

### Files
```
// Entities
user.entity.ts
refresh-token.entity.ts

// DTOs
create-user.dto.ts
update-user.dto.ts
pagination.dto.ts

// Services
user.service.ts
auth.service.ts

// Controllers
user.controller.ts
auth.controller.ts

// Modules
user.module.ts
app.module.ts

// Guards
jwt-auth.guard.ts
roles.guard.ts

// Decorators
current-user.decorator.ts
roles.decorator.ts

// Filters
http-exception.filter.ts

// Strategies
jwt.strategy.ts
jwt-refresh.strategy.ts

// Migrations
1731246000000-AddAuthenticationTables.ts

// Tests
user.service.spec.ts
auth.controller.spec.ts
```

**Pattern**: `kebab-case.type.ts` where type = entity, dto, service, controller, module, etc.

### Classes
```typescript
// ✅ DO: PascalCase for classes
export class UserService { }
export class CreateUserDto { }
export class User extends BaseEntity { }
export class JwtAuthGuard extends AuthGuard('jwt') { }

// ✅ DO: Descriptive suffixes
UserController    // Controllers
UserService       // Services
UserRepository    // Repositories
CreateUserDto     // DTOs
User              // Entities (no suffix)
JwtAuthGuard      // Guards
CurrentUser       // Decorators (no suffix)

// ❌ DON'T: Use generic names
Controller    // Too generic
Service       // Too generic
Data          // Unclear
```

### Variables & Functions
```typescript
// ✅ DO: camelCase for variables and functions
const userId = '123';
const isActive = true;
async function findUserById(id: string) { }

// ✅ DO: Descriptive boolean names (is/has/can prefix)
const isEmailVerified = true;
const hasPermission = false;
const canDelete = this.checkPermission();

// ✅ DO: Verb prefix for functions
async createUser() { }
async updateUser() { }
async deleteUser() { }
async findUserById() { }
const getConfig() { }
const setStatus() { }

// ❌ DON'T: Use abbreviations
const usrId = '123';  // Use userId
const addr = '';      // Use address
async getUsrs() { }   // Use getUsers
```

### Constants
```typescript
// ✅ DO: UPPER_SNAKE_CASE for true constants
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 10;
const API_VERSION = 'v1';

// ✅ DO: camelCase for config objects (not deeply constant)
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

// ❌ DON'T: Use UPPER_CASE for everything
const USER_SERVICE = new UserService();  // Should be: userService
```

### Interfaces & Types
```typescript
// ✅ DO: PascalCase, no 'I' prefix
interface User {
  id: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'moderator';

// ❌ DON'T: Use 'I' prefix (outdated convention)
interface IUser { }

// ✅ DO: Descriptive type aliases
type UserId = string;
type Timestamp = number;
```

### Decorators
```typescript
// ✅ DO: Use @ symbol, PascalCase
@Injectable()
@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard)

// Parameter decorators: PascalCase
@Body() createDto: CreateDto
@Param('id') id: string
@CurrentUser() user: User
```

## TypeScript Best Practices

### Type Annotations
```typescript
// ✅ DO: Explicit return types for public methods
async findAll(): Promise<User[]> {
  return this.repository.find();
}

async findOne(id: string): Promise<User> {
  return this.repository.findOne({ where: { id } });
}

// ✅ DO: Parameter types (always required)
async create(dto: CreateUserDto): Promise<User> { }

// ✅ DO: Let TypeScript infer simple variable types
const count = 10;  // inferred as number
const name = 'John';  // inferred as string

// ❌ DON'T: Over-annotate obvious types
const count: number = 10;  // Redundant
const name: string = 'John';  // Redundant
```

### Avoid `any`
```typescript
// ❌ DON'T: Use any (ESLint rule disabled, but avoid anyway)
function process(data: any) { }

// ✅ DO: Use specific types
function process(data: CreateUserDto) { }

// ✅ DO: Use unknown for truly unknown data, then narrow
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard narrows unknown to object
  }
}

// ✅ DO: Use generics for reusable code
function wrap<T>(value: T): { data: T } {
  return { data: value };
}
```

### Optional vs Nullable
```typescript
// ✅ DO: Use optional (?) for may-not-exist
interface User {
  id: string;
  email: string;
  nickname?: string;  // May not have nickname
}

// ✅ DO: Use null/undefined for explicitly absent
interface User {
  id: string;
  email: string;
  deletedAt: Date | null;  // null means "not deleted"
}

// ✅ DO: Use both when appropriate
interface Config {
  apiKey?: string | null;  // May not be provided OR explicitly disabled
}
```

### Async/Await
```typescript
// ✅ DO: Use async/await for promises
async findUser(id: string): Promise<User> {
  const user = await this.repository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}

// ❌ DON'T: Use .then() chains
findUser(id: string): Promise<User> {
  return this.repository.findOne({ where: { id } })
    .then(user => {
      if (!user) throw new NotFoundException();
      return user;
    });
}

// ✅ DO: Handle errors with try/catch
async createUser(dto: CreateUserDto): Promise<User> {
  try {
    return await this.repository.save(dto);
  } catch (error) {
    if (error.code === '23505') {  // Unique violation
      throw new ConflictException('Email already exists');
    }
    throw error;
  }
}
```

## NestJS Patterns

### Dependency Injection
```typescript
// ✅ DO: Constructor injection with readonly
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
}

// ❌ DON'T: Property injection
@Injectable()
export class UserService {
  @InjectRepository(User)
  private userRepository: Repository<User>;
}

// ❌ DON'T: Mutable dependencies
constructor(private userRepository: Repository<User>) {}
```

### Controller Structure
```typescript
// ✅ DO: Clear, RESTful structure
@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiStandardResponse(User)
  @ApiErrorResponses(400, 409)
  async create(@Body() createDto: CreateUserDto): Promise<User> {
    return this.userService.create(createDto);
  }

  @Get()
  @ApiStandardResponse(User, { isArray: true })
  async findAll(@Query() queryDto: PaginationDto): Promise<User[]> {
    return this.userService.findAll(queryDto);
  }

  @Get(':id')
  @ApiStandardResponse(User)
  @ApiErrorResponses(404)
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiStandardResponse(User)
  @ApiErrorResponses(401, 404)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(204)
  @ApiErrorResponses(401, 403, 404)
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
```

**Pattern**: 
1. Decorators first (@Controller, @ApiTags)
2. Constructor injection
3. Methods in CRUD order (Create, Read, Update, Delete)
4. Decorators before method in order: HTTP method, Guards, Roles, Status code, API docs

### Service Structure
```typescript
// ✅ DO: Business logic in services
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: Logger,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<User[]> {
    const { page = 1, limit = 10 } = paginationDto;
    return this.userRepository.find({
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createDto);
    return this.userRepository.save(user);
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);  // Reuse method
    Object.assign(user, updateDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
```

**Pattern**:
1. Find methods first (read operations)
2. Create method
3. Update method
4. Delete method
5. Throw exceptions in service, not controller

### DTO Validation
```typescript
// ✅ DO: Use class-validator decorators
export class CreateUserDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password too weak',
  })
  @ApiProperty({ example: 'SecurePass123!' })
  password: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ example: 'John', required: false })
  firstName?: string;
}

// ❌ DON'T: Skip validation
export class CreateUserDto {
  email: string;  // No validation
  password: string;  // No validation
}
```

**Pattern**: Validation first, then API docs

### Entity Definition
```typescript
// ✅ DO: Extend BaseEntity for common fields
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })  // Exclude from queries by default
  password: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];
}

// BaseEntity provides:
// - id: UUID (PK)
// - createdAt: Timestamp
// - updatedAt: Timestamp
```

**Pattern**:
1. Extend BaseEntity (provides id, createdAt, updatedAt)
2. ID first
3. Required fields
4. Optional fields
5. Relations last

### Module Organization
```typescript
// ✅ DO: Complete module definition
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // Entities this module uses
    ConfigModule,                       // External modules
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],  // Export if other modules need it
})
export class UserModule {}

// ❌ DON'T: Export everything
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, UserController],  // Don't export controllers
})
```

## Error Handling

### Throwing Exceptions
```typescript
// ✅ DO: Use NestJS exceptions
if (!user) {
  throw new NotFoundException('User not found');
}

if (user.email === existingEmail) {
  throw new ConflictException('Email already exists');
}

if (!this.canAccess(user, resource)) {
  throw new ForbiddenException('Not authorized');
}

// ✅ DO: Provide context in error messages
throw new NotFoundException(`User with ID ${id} not found`);
throw new BadRequestException(`Invalid status: ${status}`);

// ❌ DON'T: Use generic Error
throw new Error('User not found');  // Won't map to HTTP status
```

### Exception Mapping
```typescript
// Common HTTP exceptions (use appropriate one)
NotFoundException         // 404
BadRequestException       // 400
UnauthorizedException     // 401
ForbiddenException        // 403
ConflictException         // 409
InternalServerErrorException  // 500

// ✅ DO: Handle database errors
try {
  return await this.repository.save(user);
} catch (error) {
  if (error.code === '23505') {  // PostgreSQL unique violation
    throw new ConflictException('Email already exists');
  }
  if (error.code === '23503') {  // Foreign key violation
    throw new BadRequestException('Referenced entity does not exist');
  }
  throw error;  // Re-throw unknown errors
}
```

### Validation Errors
```typescript
// ✅ Handled automatically by ValidationPipe
// No need to manually throw for:
// - Missing required fields
// - Type mismatches
// - @IsEmail() failures
// - @Min/@Max violations

// Just define DTO with validators:
export class CreateUserDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(8)
  password: string;
}

// ValidationPipe returns 400 with details automatically
```

## Comments & Documentation

### When to Comment
```typescript
// ✅ DO: Comment complex business logic
async calculateUserScore(userId: string): Promise<number> {
  // Score algorithm: base (10) + posts (5 each) + comments (2 each)
  const user = await this.findOne(userId);
  const postScore = user.posts.length * 5;
  const commentScore = user.comments.length * 2;
  return 10 + postScore + commentScore;
}

// ✅ DO: Explain non-obvious decisions
async hashPassword(password: string): Promise<string> {
  // Using 10 rounds (bcrypt default) for balance between security and performance
  // Higher rounds = more secure but slower (each increment doubles time)
  return bcrypt.hash(password, 10);
}

// ❌ DON'T: Comment obvious code
// Get user by ID
async getUser(id: string) {
  return this.repository.findOne({ where: { id } });
}

// ❌ DON'T: Leave TODO comments long-term
// TODO: Add caching  <-- Create ticket instead
```

### JSDoc for Public APIs
```typescript
// ✅ DO: Document public service methods (optional but helpful)
/**
 * Finds a user by their ID
 * @param id - The user's UUID
 * @returns The user entity
 * @throws NotFoundException if user doesn't exist
 */
async findOne(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return user;
}

// For controllers, Swagger decorators serve as documentation
@Get(':id')
@ApiOperation({ summary: 'Get user by ID' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiStandardResponse(User)
@ApiErrorResponses(404)
async findOne(@Param('id') id: string): Promise<User> {
  return this.userService.findOne(id);
}
```

## Testing Patterns

### Service Unit Tests
```typescript
// ✅ DO: Mock dependencies
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: '1', email: 'test@example.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(user as User);

      expect(await service.findOne('1')).toBe(user);
    });

    it('should throw NotFoundException', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
```

## Environment Variables

### Naming
```bash
# ✅ DO: UPPER_SNAKE_CASE
PORT=3000
DB_HOST=localhost
JWT_SECRET=secret
MAX_FAILED_LOGIN_ATTEMPTS=5

# ❌ DON'T: camelCase or other formats
port=3000
dbHost=localhost
```

### Usage
```typescript
// ✅ DO: Use ConfigService with defaults
const port = this.configService.get<number>('PORT', 3000);
const jwtSecret = this.configService.get<string>('JWT_SECRET');

// ✅ DO: Validate required variables at startup
const secret = this.configService.getOrThrow<string>('JWT_SECRET');

// ❌ DON'T: Use process.env directly
const port = process.env.PORT;  // No type safety, no defaults
```

## Git Commit Messages

### Format
```bash
# ✅ DO: Use conventional commits format
feat: add user registration endpoint
fix: resolve token refresh bug
docs: update API documentation
refactor: simplify auth service logic
test: add user service unit tests
chore: update dependencies

# ✅ DO: Add scope for clarity
feat(auth): add password reset functionality
fix(user): resolve email validation issue
docs(api): add Swagger examples

# ❌ DON'T: Use vague messages
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "wip"
```

### Body (Optional)
```bash
# For complex changes, add detail
git commit -m "feat(auth): add 2FA support

- Add speakeasy library for TOTP generation
- Create 2FA setup and verify endpoints
- Update user entity with 2FA fields
- Add QR code generation for authenticator apps

Closes #123"
```

## Code Review Checklist

Before submitting code, verify:

- [ ] Code passes `npm run lint` (ESLint)
- [ ] Code passes `npm run format` (Prettier)
- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] API endpoints have Swagger decorators
- [ ] DTOs have validation decorators
- [ ] No `console.log()` (use logger instead)
- [ ] No `any` types (unless absolutely necessary)
- [ ] Error messages are descriptive
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Environment variables used for configuration
- [ ] Database queries are optimized (no N+1)
- [ ] Commit messages follow conventional format

## Running Code Quality Tools

```bash
# Format code (auto-fix)
npm run format

# Lint code (find issues)
npm run lint

# Lint and auto-fix
npm run lint

# Run tests
npm test

# Test with coverage
npm run test:cov
```

## Common Anti-Patterns to Avoid

```typescript
// ❌ Business logic in controller
@Post()
async create(@Body() dto: CreateUserDto) {
  const user = this.repository.create(dto);
  user.password = await bcrypt.hash(dto.password, 10);
  return this.repository.save(user);
}

// ✅ Business logic in service
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}

// ❌ Circular dependencies
// user.module.ts imports auth.module.ts
// auth.module.ts imports user.module.ts
// Solution: Use forwardRef() or restructure modules

// ❌ Exposing internal IDs
{
  "userId": 123,  // Sequential ID reveals user count
}
// ✅ Use UUIDs
{
  "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}

// ❌ Not using DTOs
@Post()
create(@Body() body: any) {
  return this.service.create(body);
}
// ✅ Use typed DTOs with validation
@Post()
create(@Body() createDto: CreateUserDto) {
  return this.service.create(createDto);
}

// ❌ Returning full user including password
return this.userRepository.findOne({ where: { id } });
// ✅ Exclude sensitive fields
@Column({ select: false })
password: string;
// Or manually delete
delete user.password;
return user;
```

---

**Last Updated**: November 10, 2025  
**Prettier Version**: ^3.0.0  
**ESLint Version**: ^8.0.0  
**TypeScript Version**: ^5.0.0

**Enforcement**: Run `npm run format` and `npm run lint` before commits. CI/CD pipeline checks these automatically.
