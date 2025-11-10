import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthenticationTables1731246000000 implements MigrationInterface {
  name = 'AddAuthenticationTables1731246000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255),
        "role" VARCHAR(50) DEFAULT 'user',
        "isActive" BOOLEAN DEFAULT true,
        "isEmailVerified" BOOLEAN DEFAULT false,
        "failedLoginAttempts" INTEGER DEFAULT 0,
        "lockedUntil" TIMESTAMP,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on email for faster user lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_email" ON "users"("email")
    `);

    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "token" VARCHAR(255) NOT NULL,
        "userId" UUID NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "isRevoked" BOOLEAN DEFAULT false,
        "revokedAt" TIMESTAMP,
        "replacedByToken" VARCHAR(255),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_refresh_token_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create index on token for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_token" ON "refresh_tokens"("token")
    `);

    // Create index on userId for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_token_user" ON "refresh_tokens"("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop refresh_tokens table
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    // Drop users table
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
