import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 3: search (full-text + trigram), nearby places, recommendation settings and activity. */
export class SearchRecommendations1791975183944 implements MigrationInterface {
  name = 'SearchRecommendations1791975183944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`
            CREATE TABLE "listing_nearby_places" (
                "id" BIGSERIAL NOT NULL,
                "listing_id" uuid NOT NULL,
                "category" character varying(12) NOT NULL,
                "name" character varying(160) NOT NULL,
                "distance_m" integer NOT NULL,
                CONSTRAINT "PK_945f1ea167cc613ecba3e8ce7ff" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_90ec55838670cc0abadae55d4d" ON "listing_nearby_places" ("listing_id", "category")
        `);
    await queryRunner.query(`
            CREATE TABLE "listing_activities" (
                "id" BIGSERIAL NOT NULL,
                "user_id" uuid NOT NULL,
                "listing_id" uuid NOT NULL,
                "type" character varying(12) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_2b8d2d8bfa8c9ffc2fe4d1ba781" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0b1a542ccfaff75c6924b48d36" ON "listing_activities" ("listing_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ea071c2d58fd099333aadf4960" ON "listing_activities" ("user_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "recommendation_settings" (
                "id" smallint NOT NULL DEFAULT '1',
                "weights" jsonb NOT NULL,
                "updated_by" uuid,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_71ca9cfa20c6547aa30ef8a68cc" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "search_vector" tsvector GENERATED ALWAYS AS (
                    setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(
                        to_tsvector('simple', coalesce(address, '')),
                        'B'
                    ) || setweight(
                        to_tsvector('simple', coalesce(description, '')),
                        'C'
                    )
                ) STORED NOT NULL
        `);
    await queryRunner.query(
      `
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES ($1, $2, $3, $4, $5, $6)
        `,
      [
        queryRunner.connection.driver.database,
        'public',
        'listings',
        'GENERATED_COLUMN',
        'search_vector',
        "setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(address, '')), 'B') || setweight(to_tsvector('simple', coalesce(description, '')), 'C')",
      ],
    );
    await queryRunner.query(`
            ALTER TABLE "listing_nearby_places"
            ADD CONSTRAINT "FK_fdbd91f5ff34ab55ab4b18dccea" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    // GIN indexes TypeORM cannot express (declared with synchronize: false on the entities).
    await queryRunner.query(
      `CREATE INDEX "IDX_listings_search_vector" ON "listings" USING gin ("search_vector")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_areas_name_trgm" ON "areas" USING gin ("name" gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_areas_name_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listings_search_vector"`);
    await queryRunner.query(`
            ALTER TABLE "listing_nearby_places" DROP CONSTRAINT "FK_fdbd91f5ff34ab55ab4b18dccea"
        `);
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "database" = $3
                AND "schema" = $4
                AND "table" = $5
        `,
      [
        'GENERATED_COLUMN',
        'search_vector',
        queryRunner.connection.driver.database,
        'public',
        'listings',
      ],
    );
    await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "search_vector"
        `);
    await queryRunner.query(`
            DROP TABLE "recommendation_settings"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ea071c2d58fd099333aadf4960"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0b1a542ccfaff75c6924b48d36"
        `);
    await queryRunner.query(`
            DROP TABLE "listing_activities"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_90ec55838670cc0abadae55d4d"
        `);
    await queryRunner.query(`
            DROP TABLE "listing_nearby_places"
        `);
  }
}
