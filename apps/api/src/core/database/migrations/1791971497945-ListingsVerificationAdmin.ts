import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 2: listings + media, lister verification requests. */
export class ListingsVerificationAdmin1791971497945 implements MigrationInterface {
  name = 'ListingsVerificationAdmin1791971497945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "listings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "owner_id" uuid NOT NULL,
                "type" character varying(8) NOT NULL,
                "status" character varying(24) NOT NULL DEFAULT 'draft',
                "title" character varying(100),
                "description" text,
                "rent" integer,
                "deposit" integer,
                "sharing" character varying(8),
                "gender" character varying(12),
                "furnishing" character varying(16),
                "food_included" boolean NOT NULL DEFAULT false,
                "amenities" text array NOT NULL DEFAULT '{}',
                "house_rules" text,
                "available_from" date,
                "address" character varying(300),
                "location" geography(Point, 4326),
                "area_id" uuid,
                "city_id" uuid,
                "rejection_reason" character varying(500),
                "published_at" TIMESTAMP WITH TIME ZONE,
                "submitted_at" TIMESTAMP WITH TIME ZONE,
                "view_count" integer NOT NULL DEFAULT '0',
                "contact_count" integer NOT NULL DEFAULT '0',
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_520ecac6c99ec90bcf5a603cdcb" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9f5b6113628f91bcf8a8e2dfa3" ON "listings" ("owner_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_085bc90a6a48842f8266fcbc63" ON "listings" USING gist ("location")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_844247dce636c3f6950de2dc72" ON "listings" ("area_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e9524c012874c1d1163321f9bf" ON "listings" ("city_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2f5d4099616aa3a1e9f0177c73" ON "listings" ("status", "published_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "listing_media" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "listing_id" uuid NOT NULL,
                "kind" character varying(8) NOT NULL,
                "storage_key" character varying(255) NOT NULL,
                "thumbnail_key" character varying(255),
                "width" integer,
                "height" integer,
                "size_bytes" integer NOT NULL,
                "position" smallint NOT NULL DEFAULT '0',
                CONSTRAINT "PK_95a44b7c28e30592adad8b85e51" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5223d4a5fae4cf2543ddb35ce3" ON "listing_media" ("listing_id", "position")
        `);
    await queryRunner.query(`
            CREATE TABLE "verification_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'pending',
                "id_document_key" character varying(255) NOT NULL,
                "property_document_key" character varying(255) NOT NULL,
                "rejection_reason" character varying(500),
                "reviewed_by" uuid,
                "reviewed_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_c5d405ea25e8abd5b0b096a4f6f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_44f76cc6635620daadc8229d7d" ON "verification_requests" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cc75e34f61e7761ea43a18fb67" ON "verification_requests" ("status", "created_at")
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_9f5b6113628f91bcf8a8e2dfa3c" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_844247dce636c3f6950de2dc72c" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_e9524c012874c1d1163321f9bf8" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_media"
            ADD CONSTRAINT "FK_d6e41836cd0907f44729c12285e" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "verification_requests"
            ADD CONSTRAINT "FK_44f76cc6635620daadc8229d7db" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "verification_requests" DROP CONSTRAINT "FK_44f76cc6635620daadc8229d7db"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_media" DROP CONSTRAINT "FK_d6e41836cd0907f44729c12285e"
        `);
    await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_e9524c012874c1d1163321f9bf8"
        `);
    await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_844247dce636c3f6950de2dc72c"
        `);
    await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_9f5b6113628f91bcf8a8e2dfa3c"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_cc75e34f61e7761ea43a18fb67"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_44f76cc6635620daadc8229d7d"
        `);
    await queryRunner.query(`
            DROP TABLE "verification_requests"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5223d4a5fae4cf2543ddb35ce3"
        `);
    await queryRunner.query(`
            DROP TABLE "listing_media"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_2f5d4099616aa3a1e9f0177c73"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e9524c012874c1d1163321f9bf"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_844247dce636c3f6950de2dc72"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_085bc90a6a48842f8266fcbc63"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9f5b6113628f91bcf8a8e2dfa3"
        `);
    await queryRunner.query(`
            DROP TABLE "listings"
        `);
  }
}
