# Authentication & Authorization

> **AI Context Document**: This document describes how authentication and authorization work in this system. Use this to implement secure endpoints, understand auth flows, and make security decisions.

## Quick Reference

### Adding Authentication to a Route
```typescript
// Require login only
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}

// Require specific role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
@Delete(':id')
deleteUser() { }
```

### Getting Current User
```typescript
// Option 1: @CurrentUser() decorator
getProfile(@CurrentUser() user: User) {
  // user is fully typed User entity
}

// Option 2: Request object
getProfile(@Request() req) {
  const user = req.user; // User entity
}
```

## Authentication Strategy

### Overview
- **Type**: JWT-based token authentication
- **Access Tokens**: Short-lived (1 hour), stateless, stored client-side
- **Refresh Tokens**: Long-lived (7 days), stored in database, revocable
- **Password Hashing**: Bcrypt with 10 rounds
- **Token Rotation**: New refresh token issued on each refresh

### Why This Approach?
- ✅ **Stateless Access Tokens**: No server-side session storage needed
- ✅ **Revocable Refresh Tokens**: Can invalidate sessions (logout)
- ✅ **Security**: Short-lived access tokens limit damage if compromised
- ✅ **Scalability**: Works across multiple server instances
- ✅ **Standard**: Industry best practice for REST APIs

## Authentication Flow

### 1. Registration Flow

```
Client                    Server                  Database
  |                         |                         |
  |--POST /auth/register--->|                         |
  |  { email, password }    |                         |
  |                         |--Check email exists---->|
  |                         |<-----------------------|
  |                         |                         |
  |                         |--Hash password (bcrypt)-|
  |                         |                         |
  |                         |--Create user----------->|
  |                         |<-----------------------|
  |                         |                         |
  |                         |--Generate access token--|
  |                         |--Generate refresh token-|
  |                         |--Store refresh token--->|
  |                         |<-----------------------|
  |<-----------------------|                         |
  |  { accessToken,         |                         |
  |    refreshToken,        |                         |
  |    user }               |                         |
```

**Endpoint**: `POST /auth/register`

**Request**:
```typescript
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201):
```typescript
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Business Rules**:
- Email must be unique
- Password requirements: (defined in CreateUserDto)
- New users are active by default (`isActive: true`)
- Email verification status: `isEmailVerified: false` (not implemented yet)

### 2. Login Flow

```
Client                    Server                  Database
  |                         |                         |
  |--POST /auth/login------>|                         |
  |  { email, password }    |                         |
  |                         |--Find user by email---->|
  |                         |<-----------------------|
  |                         |                         |
  |                         |--Check account locked?--|
  |                         |                         |
  |                         |--Verify password--------|
  |                         |  (bcrypt.compare)       |
  |                         |                         |
  |                         |--Reset failed attempts->|
  |                         |--Update lastLoginAt---->|
  |                         |                         |
  |                         |--Generate tokens--------|
  |                         |--Store refresh token--->|
  |                         |<-----------------------|
  |<-----------------------|                         |
  |  { accessToken,         |                         |
  |    refreshToken,        |                         |
  |    user }               |                         |
```

**Endpoint**: `POST /auth/login`

**Request**:
```typescript
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```typescript
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Error Cases**:
- `401`: Invalid credentials
- `401`: Account locked (after 5 failed attempts)
- `404`: User not found

**Security Features**:
- Failed login tracking (increments `failedLoginAttempts`)
- Account lockout after 5 failures (15 minutes)
- Password comparison uses constant-time bcrypt
- Logs all login attempts (success and failure)

### 3. Token Refresh Flow

```
Client                    Server                  Database
  |                         |                         |
  |--POST /auth/refresh---->|                         |
  |  { refreshToken }       |                         |
  |                         |--Verify JWT signature---|
  |                         |                         |
  |                         |--Find token in DB------>|
  |                         |<-----------------------|
  |                         |                         |
  |                         |--Check expiration-------|
  |                         |--Check revocation-------|
  |                         |                         |
  |                         |--Revoke old token------>|
  |                         |--Generate new tokens----|
  |                         |--Store new refresh----->|
  |                         |<-----------------------|
  |<-----------------------|                         |
  |  { accessToken,         |                         |
  |    refreshToken }       |                         |
```

**Endpoint**: `POST /auth/refresh`

**Request**:
```typescript
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200):
```typescript
{
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Cases**:
- `401`: Invalid token signature
- `401`: Token expired
- `401`: Token revoked (manually logged out)
- `401`: Token not found in database

**Token Rotation**:
- Old refresh token is revoked immediately
- New refresh token is generated and stored
- Prevents token replay attacks
- Limits damage if refresh token is compromised

### 4. Logout Flow

```
Client                    Server                  Database
  |                         |                         |
  |--POST /auth/logout----->|                         |
  |  Authorization: Bearer  |                         |
  |                         |--Extract user from JWT--|
  |                         |                         |
  |                         |--Revoke all tokens----->|
  |                         |  WHERE userId = ?       |
  |                         |<-----------------------|
  |<-----------------------|                         |
  |  { message: success }   |                         |
```

**Endpoint**: `POST /auth/logout`

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response** (200):
```typescript
{
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

**Behavior**:
- Requires valid access token (authenticated)
- Revokes ALL refresh tokens for the user
- Logs out from all devices
- Access token remains valid until expiration (1 hour max)

**Note**: For single-device logout, would need to store device IDs with tokens.

## JWT Token Structure

### Access Token Payload
```typescript
{
  "sub": "user-uuid",           // Subject (user ID)
  "email": "user@example.com",  // User email
  "iat": 1699632000,            // Issued at (timestamp)
  "exp": 1699635600             // Expires at (timestamp)
}
```

**Lifetime**: 1 hour (configurable via `JWT_EXPIRES_IN`)  
**Storage**: Client-side (localStorage, sessionStorage, or memory)  
**Security**: Signed with `JWT_SECRET`, cannot be tampered with

### Refresh Token Payload
```typescript
{
  "sub": "user-uuid",           // Subject (user ID)
  "tokenId": "token-uuid",      // Token ID in database
  "iat": 1699632000,            // Issued at (timestamp)
  "exp": 1700236800             // Expires at (timestamp)
}
```

**Lifetime**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)  
**Storage**: Client-side (httpOnly cookie recommended, or localStorage)  
**Security**: Signed with `JWT_REFRESH_SECRET`, stored in database for revocation

## Authorization Strategy

### Role-Based Access Control (RBAC)

#### User Roles
Roles are stored directly on the User entity:

```typescript
@Entity('users')
export class User extends BaseEntity {
  // ... other fields
  
  @Column({ type: 'simple-array', nullable: true })
  roles?: string[]; // e.g., ['user', 'admin', 'moderator']
}
```

**Default Role**: New users don't have roles array (or empty array)  
**Multiple Roles**: Users can have multiple roles simultaneously

#### Implementing Protected Routes

**Step 1: Add Roles Decorator**
```typescript
import { Roles } from '@/common/decorators/roles.decorator';

@Roles('admin')
@Delete(':id')
deleteUser() { }
```

**Step 2: Apply Guards**
```typescript
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController { }
```

**Guard Execution Order**:
1. `JwtAuthGuard`: Verifies JWT, attaches user to request
2. `RolesGuard`: Checks if user has required roles

#### How RolesGuard Works

```typescript
// Pseudocode
canActivate(context) {
  // 1. Get required roles from @Roles() decorator
  const requiredRoles = Reflector.get('roles', handler);
  
  // 2. If no roles required, allow access
  if (!requiredRoles) return true;
  
  // 3. Get user from request (set by JwtAuthGuard)
  const user = request.user;
  
  // 4. Check if user has ANY of the required roles
  return requiredRoles.some(role => user.roles?.includes(role));
}
```

**Logic**: User needs **at least one** of the required roles (OR logic)

**Example**:
```typescript
@Roles('admin', 'moderator')  // User needs to be admin OR moderator
@Delete(':id')
deleteUser() { }
```

### Permission Levels

#### Public Routes
No guards needed, accessible to everyone:
```typescript
@Post('register')
register() { }

@Post('login')
login() { }

@Get('health')
health() { }
```

#### Authenticated Routes
Requires valid JWT, any logged-in user:
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

#### Role-Protected Routes
Requires specific role(s):
```typescript
// Admin only
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete('users/:id')
deleteUser() { }

// Admin or Moderator
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
@Patch('posts/:id/approve')
approvePost() { }

// Multiple roles on controller level
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  // All routes require admin role
}
```

### Resource-Based Authorization

For checking ownership (e.g., "can user edit their own post?"):

```typescript
@UseGuards(JwtAuthGuard)
@Patch('posts/:id')
async updatePost(
  @Param('id') id: string,
  @CurrentUser() user: User,
  @Body() updateDto: UpdatePostDto,
) {
  const post = await this.postService.findOne(id);
  
  // Check ownership or admin
  if (post.authorId !== user.id && !user.roles?.includes('admin')) {
    throw new ForbiddenException('You can only edit your own posts');
  }
  
  return this.postService.update(id, updateDto);
}
```

**Pattern**: Check resource ownership in service/controller logic

## Security Implementation Details

### Password Security

#### Hashing
```typescript
import * as bcrypt from 'bcrypt';

// On registration/password change
const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const hashedPassword = await bcrypt.hash(plainPassword, rounds);

// On login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Configuration**: `BCRYPT_ROUNDS=10` (default)  
**Trade-off**: Higher rounds = more secure but slower (10 is recommended)

#### Password Requirements
Enforced via `class-validator` decorators in DTOs:
```typescript
export class RegisterDto {
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;
}
```

**Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Account Lockout

#### Configuration
```bash
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=15  # minutes
```

#### How It Works
```typescript
// On failed login
user.failedLoginAttempts += 1;

if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
  user.accountLockedUntil = new Date(Date.now() + LOCKOUT_DURATION * 60000);
  throw new UnauthorizedException('Account locked due to too many failed attempts');
}

// On successful login
user.failedLoginAttempts = 0;
user.accountLockedUntil = null;
```

**Reset**: Counter resets on successful login  
**Duration**: Automatic unlock after lockout period expires

### Token Security

#### Secret Management
```bash
# .env (NEVER commit these)
JWT_SECRET=generate-a-strong-random-secret-here
JWT_REFRESH_SECRET=different-strong-random-secret-here
```

**Generation**:
```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Best Practices**:
- ✅ Different secrets for access and refresh tokens
- ✅ Store in environment variables
- ✅ Rotate secrets periodically
- ✅ Use strong random values (64+ characters)

#### Token Validation
```typescript
// JWT Strategy validates:
1. Signature (using JWT_SECRET)
2. Expiration (exp claim)
3. User exists in database
4. User is active (isActive: true)

// Refresh Strategy additionally validates:
5. Token exists in database
6. Token not revoked (isRevoked: false)
7. Token not expired (expiresAt > now)
```

### CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

**Production**: Set `CORS_ORIGIN` to your frontend domain

### Rate Limiting

```typescript
// Per IP address
ThrottlerModule.forRoot({
  ttl: 60,      // Time window (seconds)
  limit: 100,   // Max requests per window
})
```

**Applied**: Globally to all routes  
**Override**: Use `@SkipThrottle()` or `@Throttle()` decorators per route

### Security Headers (Helmet)

```typescript
// main.ts
app.use(helmet());
```

**Headers Added**:
- `Content-Security-Policy`: Prevents XSS attacks
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `Strict-Transport-Security`: Enforces HTTPS
- `X-XSS-Protection`: XSS filter (legacy browsers)

## Common Patterns

### Getting User in Service Layer

```typescript
@Injectable()
export class PostService {
  async createPost(createDto: CreatePostDto, userId: string) {
    // userId passed from controller
    const post = this.postRepository.create({
      ...createDto,
      authorId: userId,
    });
    return this.postRepository.save(post);
  }
}

// Controller
@Post()
createPost(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
  return this.postService.createPost(dto, user.id);
}
```

**Pattern**: Pass user ID from controller to service, not entire User entity

### Optional Authentication

For routes that work with or without auth:

```typescript
@Get('posts')
async getPosts(
  @CurrentUser() user?: User,  // Optional
  @Query() queryDto: QueryDto,
) {
  // Show more content if authenticated
  const options = {
    includePrivate: !!user,
    userId: user?.id,
  };
  return this.postService.findAll(queryDto, options);
}
```

**Guard**: Don't apply JwtAuthGuard, handle user presence in logic

### Checking Permissions in Service

```typescript
@Injectable()
export class PostService {
  async update(id: string, updateDto: UpdatePostDto, userId: string) {
    const post = await this.findOne(id);
    
    if (post.authorId !== userId) {
      throw new ForbiddenException('Not authorized to update this post');
    }
    
    return this.postRepository.save({ ...post, ...updateDto });
  }
}
```

**Pattern**: Service handles business logic, throws exceptions on authorization failure

### Admin Bypass Pattern

```typescript
async deletePost(id: string, user: User) {
  const post = await this.findOne(id);
  
  // Allow if owner or admin
  const isOwner = post.authorId === user.id;
  const isAdmin = user.roles?.includes('admin');
  
  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('Not authorized');
  }
  
  return this.postRepository.delete(id);
}
```

**Pattern**: Check ownership first, then check admin role as fallback

## Client-Side Integration

### Storing Tokens

**Option 1: localStorage (Simple but less secure)**
```javascript
// After login/register
localStorage.setItem('accessToken', response.data.accessToken);
localStorage.setItem('refreshToken', response.data.refreshToken);

// On requests
const token = localStorage.getItem('accessToken');
headers: { Authorization: `Bearer ${token}` }
```

**Option 2: httpOnly Cookies (More secure)**
```javascript
// Server sets cookie on login
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Browser sends automatically
// Access token still in localStorage for API calls
```

### Making Authenticated Requests

```javascript
// Axios example
const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/auth/refresh', { refreshToken });
      
      // Store new tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Retry original request
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(error.config);
    }
    throw error;
  }
);
```

## Extending Authentication

### Adding OAuth (Future)

1. Install passport strategies:
```bash
npm install @nestjs/passport passport-google-oauth20
npm install --save-dev @types/passport-google-oauth20
```

2. Create strategy:
```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }
  
  async validate(accessToken, refreshToken, profile) {
    // Find or create user
    return this.authService.validateOAuthUser(profile);
  }
}
```

3. Add routes:
```typescript
@Get('google')
@UseGuards(AuthGuard('google'))
googleAuth() { }

@Get('google/callback')
@UseGuards(AuthGuard('google'))
googleCallback(@Request() req) {
  return this.authService.login(req.user);
}
```

### Adding Email Verification (Future)

1. Add verification token to User entity:
```typescript
@Column({ nullable: true })
emailVerificationToken?: string;

@Column({ default: false })
isEmailVerified: boolean;
```

2. On registration:
```typescript
const token = crypto.randomBytes(32).toString('hex');
user.emailVerificationToken = token;
await this.sendVerificationEmail(user.email, token);
```

3. Verification endpoint:
```typescript
@Get('verify-email')
async verifyEmail(@Query('token') token: string) {
  const user = await this.userRepository.findOne({
    where: { emailVerificationToken: token },
  });
  
  if (!user) throw new BadRequestException('Invalid token');
  
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  await this.userRepository.save(user);
  
  return { message: 'Email verified successfully' };
}
```

### Adding 2FA (Future)

1. Install speakeasy:
```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

2. Add to User entity:
```typescript
@Column({ nullable: true })
twoFactorSecret?: string;

@Column({ default: false })
isTwoFactorEnabled: boolean;
```

3. Setup endpoint:
```typescript
@Post('2fa/setup')
async setup2FA(@CurrentUser() user: User) {
  const secret = speakeasy.generateSecret();
  const qrCode = await qrcode.toDataURL(secret.otpauth_url);
  
  // Store temporarily (confirm before saving)
  return { secret: secret.base32, qrCode };
}
```

4. Verify on login:
```typescript
@Post('2fa/verify')
async verify2FA(@Body() dto: Verify2FADto) {
  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: dto.code,
  });
  
  if (!valid) throw new UnauthorizedException('Invalid 2FA code');
  
  return this.generateTokens(user);
}
```

## Decision Trees for AI

### Should I protect this route?

```
Is the route handling sensitive data?
├─ YES: Require authentication (@UseGuards(JwtAuthGuard))
└─ NO: Is it a mutating operation (POST/PATCH/DELETE)?
    ├─ YES: Require authentication
    └─ NO: Public route (no guard)

Does the route require specific permissions?
├─ YES: Add roles guard (@UseGuards(JwtAuthGuard, RolesGuard) + @Roles())
└─ NO: Just authentication is enough
```

### How should I handle resource ownership?

```
Is this a resource that belongs to users?
├─ YES: Check ownership in service logic
│   ├─ User is owner? → Allow
│   ├─ User is admin? → Allow
│   └─ Else → throw ForbiddenException
└─ NO: Use role-based authorization only
```

### Should I use access token or refresh token?

```
Is this a regular API call?
├─ YES: Use access token in Authorization header
└─ NO: Is this token refresh?
    ├─ YES: Use refresh token in request body
    └─ NO: Use access token
```

## Troubleshooting

### "Unauthorized" on protected routes
1. Check if `Authorization: Bearer <token>` header is present
2. Verify token hasn't expired (use jwt.io to decode)
3. Check user exists and `isActive: true`
4. Verify `JWT_SECRET` matches between sign and verify

### "Forbidden" on role-protected routes
1. Check user has required role: `user.roles?.includes('admin')`
2. Verify RolesGuard is applied AFTER JwtAuthGuard
3. Check @Roles() decorator has correct role names (case-sensitive)

### Token refresh fails
1. Verify refresh token exists in database
2. Check `isRevoked: false` and `expiresAt > now`
3. Ensure using `JWT_REFRESH_SECRET` (not JWT_SECRET)
4. Check refresh token wasn't already used (rotation)

### Account locked unexpectedly
1. Check `failedLoginAttempts` count in database
2. Verify `accountLockedUntil` timestamp hasn't expired
3. Reset manually: `UPDATE users SET failedLoginAttempts = 0, accountLockedUntil = NULL WHERE id = ?`

---

**Last Updated**: November 10, 2025  
**Auth System Maturity**: 8.5/10 (Production-ready)  
**Reference**: See `docs/reports/authentication-maturity-report.md` for detailed assessment
