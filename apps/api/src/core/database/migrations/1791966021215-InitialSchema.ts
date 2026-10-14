import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 1 schema: users & auth sessions, geo (PostGIS), remote app config, OTA updates. */
export class InitialSchema1791966021215 implements MigrationInterface {
  name = 'InitialSchema1791966021215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(`
            CREATE TABLE "app_platform_configs" (
                "platform" character varying(8) NOT NULL,
                "min_supported_version" character varying(20) NOT NULL,
                "latest_version" character varying(20) NOT NULL,
                "store_url" character varying(512) NOT NULL,
                "feature_flags" jsonb NOT NULL DEFAULT '{}',
                "support_phone" character varying(20),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_77569125fa5d69181ba5e7b114c" PRIMARY KEY ("platform")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "lister_profiles" (
                "user_id" uuid NOT NULL,
                "type" character varying(16) NOT NULL,
                "business_name" character varying(120),
                "is_verified" boolean NOT NULL DEFAULT false,
                "verified_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ca706583753fd195ede3bf48da9" PRIMARY KEY ("user_id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "firebase_uid" character varying(128) NOT NULL,
                "phone" character varying(20),
                "email" character varying(160),
                "full_name" character varying(80),
                "avatar_url" character varying(512),
                "roles" text array NOT NULL DEFAULT '{customer}',
                "status" character varying(16) NOT NULL DEFAULT 'active',
                "auth_provider" character varying(16) NOT NULL,
                "last_login_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_0fd54ced5cc75f7cb92925dd80" ON "users" ("firebase_uid")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_ff1c0e6a4865132a5f7f028d2d" ON "users" ("phone")
            WHERE phone IS NOT NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);
    await queryRunner.query(`
            CREATE TABLE "auth_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "refresh_token_hash" character(64) NOT NULL,
                "device_id" character varying(128),
                "platform" character varying(8),
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked_at" TIMESTAMP WITH TIME ZONE,
                "last_used_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_50ccaa6440288a06f0ba693ccc" ON "auth_sessions" ("user_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_8ae45196f82be4540770b41ac5" ON "auth_sessions" ("refresh_token_hash")
        `);
    await queryRunner.query(`
            CREATE TABLE "ota_updates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "platform" character varying(8) NOT NULL,
                "runtime_version" character varying(128) NOT NULL,
                "channel" character varying(16) NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'active',
                "rollout_percent" smallint NOT NULL DEFAULT '100',
                "is_critical" boolean NOT NULL DEFAULT false,
                "message" text,
                "git_commit" character varying(64),
                "manifest" jsonb NOT NULL,
                "expo_config" jsonb NOT NULL,
                "launch_count" integer NOT NULL DEFAULT '0',
                "crash_count" integer NOT NULL DEFAULT '0',
                "published_by" character varying(80),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "CHK_4041f33d10e9faa34317ac29f0" CHECK (
                    "rollout_percent" BETWEEN 0 AND 100
                ),
                CONSTRAINT "PK_5ceae2cdbfe6221025bb6f52195" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_acee8f9b3a8b7a3e2c42e1aa1d" ON "ota_updates" (
                "platform",
                "runtime_version",
                "channel",
                "status",
                "created_at"
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "areas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "city_id" uuid NOT NULL,
                "name" character varying(100) NOT NULL,
                "slug" character varying(120) NOT NULL,
                "center" geography(Point, 4326) NOT NULL,
                "is_popular" boolean NOT NULL DEFAULT false,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_80f0c713a07a49f0b7020dadd7" ON "areas" ("city_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5da87ab9fb20f60e26cd4e6549" ON "areas" USING gist ("center")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_54881389b3452fa08b64068580" ON "areas" ("city_id", "slug")
        `);
    await queryRunner.query(`
            CREATE TABLE "cities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying(80) NOT NULL,
                "state" character varying(80) NOT NULL,
                "slug" character varying(100) NOT NULL,
                "center" geography(Point, 4326) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_8ef722e770798e37b3205370bf" ON "cities" ("slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5b4f09959449d6e650fc5a1170" ON "cities" USING gist ("center")
        `);
    await queryRunner.query(`
            CREATE TABLE "user_devices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "device_id" character varying(128) NOT NULL,
                "platform" character varying(8) NOT NULL,
                "push_token" character varying(512),
                "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_69b11f34c0f681c815fb697101" ON "user_devices" ("user_id", "device_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "lister_profiles"
            ADD CONSTRAINT "FK_ca706583753fd195ede3bf48da9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_sessions"
            ADD CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "areas"
            ADD CONSTRAINT "FK_80f0c713a07a49f0b7020dadd70" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_devices"
            ADD CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_devices" DROP CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241"
        `);
    await queryRunner.query(`
            ALTER TABLE "areas" DROP CONSTRAINT "FK_80f0c713a07a49f0b7020dadd70"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6"
        `);
    await queryRunner.query(`
            ALTER TABLE "lister_profiles" DROP CONSTRAINT "FK_ca706583753fd195ede3bf48da9"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_69b11f34c0f681c815fb697101"
        `);
    await queryRunner.query(`
            DROP TABLE "user_devices"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5b4f09959449d6e650fc5a1170"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8ef722e770798e37b3205370bf"
        `);
    await queryRunner.query(`
            DROP TABLE "cities"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_54881389b3452fa08b64068580"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5da87ab9fb20f60e26cd4e6549"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_80f0c713a07a49f0b7020dadd7"
        `);
    await queryRunner.query(`
            DROP TABLE "areas"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_acee8f9b3a8b7a3e2c42e1aa1d"
        `);
    await queryRunner.query(`
            DROP TABLE "ota_updates"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8ae45196f82be4540770b41ac5"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_50ccaa6440288a06f0ba693ccc"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_sessions"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ff1c0e6a4865132a5f7f028d2d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0fd54ced5cc75f7cb92925dd80"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TABLE "lister_profiles"
        `);
    await queryRunner.query(`
            DROP TABLE "app_platform_configs"
        `);
  }
}
