import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 4: favourites, saved searches, leads + visits, chat, reviews, reports, notifications. */
export class Engagement1791977577991 implements MigrationInterface {
  name = 'Engagement1791977577991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "listing_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "owner_id" uuid NOT NULL,
                "last_message_at" TIMESTAMP WITH TIME ZONE,
                "last_message_preview" character varying(160),
                "last_message_sender_id" uuid,
                "customer_last_read_at" TIMESTAMP WITH TIME ZONE,
                "owner_last_read_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bff4731395e35ab32480ad08e6" ON "conversations" ("owner_id", "last_message_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4e8a346870493906aad7fc3656" ON "conversations" ("customer_id", "last_message_at")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_d698173ca94105ede5371ae97b" ON "conversations" ("listing_id", "customer_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "conversation_id" uuid NOT NULL,
                "sender_id" uuid NOT NULL,
                "body" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8584a1974e1ca95f4861d975ff" ON "messages" ("conversation_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "favorites" (
                "user_id" uuid NOT NULL,
                "listing_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_0f8db9b83a100398d2611a8c9d0" PRIMARY KEY ("user_id", "listing_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_74e0699c35d78e39b229d64f34" ON "favorites" ("listing_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_fa8b76306d731663cdaa42a335" ON "favorites" ("user_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "leads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "listing_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "owner_id" uuid NOT NULL,
                "channels" text array NOT NULL DEFAULT '{}',
                "last_contact_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_16d9cef47004d4053b548d3017" ON "leads" ("customer_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_47a60e02ba4c2d7a44d370ff9e" ON "leads" ("owner_id", "last_contact_at")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_d41b63827432116dad3a3087d6" ON "leads" ("listing_id", "customer_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "visits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "lead_id" uuid NOT NULL,
                "listing_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "owner_id" uuid NOT NULL,
                "date" date NOT NULL,
                "slot" character varying(12) NOT NULL,
                "note" character varying(300),
                "status" character varying(12) NOT NULL DEFAULT 'requested',
                "owner_note" character varying(300),
                CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bfe7705c583c45fcf8a1d27edd" ON "visits" ("lead_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_08a45e637a72a538cd714726a9" ON "visits" ("owner_id", "status", "date")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d8ed2c37288866ed45ecc8461a" ON "visits" ("customer_id", "date")
        `);
    await queryRunner.query(`
            CREATE TABLE "broadcasts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying(80) NOT NULL,
                "body" character varying(300) NOT NULL,
                "city_id" uuid,
                "recipient_count" integer NOT NULL DEFAULT '0',
                "created_by" uuid NOT NULL,
                CONSTRAINT "PK_b0586900034d0726bbdcb1b21b2" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "type" character varying(32) NOT NULL,
                "title" character varying(120) NOT NULL,
                "body" character varying(500) NOT NULL,
                "url" character varying(255),
                "read_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e7d15e99d345ae0ffa23c58158" ON "notifications" ("read_at")
            WHERE read_at IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_310667f935698fcd8cb319113a" ON "notifications" ("user_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "reports" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "listing_id" uuid NOT NULL,
                "reporter_id" uuid NOT NULL,
                "reason" character varying(16) NOT NULL,
                "details" character varying(500),
                "status" character varying(12) NOT NULL DEFAULT 'open',
                "resolution_note" character varying(500),
                "resolved_by" uuid,
                "resolved_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9459b9bf907a3807ef7143d2ea" ON "reports" ("reporter_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3f7f0ac8fa053c54b928ac8970" ON "reports" ("listing_id", "status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_247926e3daeab8a5d1b15edde8" ON "reports" ("status", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "reviews" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "listing_id" uuid NOT NULL,
                "author_id" uuid NOT NULL,
                "rating" smallint NOT NULL,
                "comment" character varying(1000),
                CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7efc8ac1a6389e4e9317435ad2" ON "reviews" ("author_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b539fd7cc1053583f341789dcb" ON "reviews" ("listing_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e9a494c6c7484f5c9f51c4ccd7" ON "reviews" ("listing_id", "author_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "saved_searches" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "label" character varying(80) NOT NULL,
                "location" geography(Point, 4326) NOT NULL,
                "radius_km" real NOT NULL,
                "filters" jsonb NOT NULL DEFAULT '{}',
                "alerts_enabled" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_d9a53c71ccc5cf66dcdc5b33dfe" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8f01d13ac8e7b451d244674274" ON "saved_searches" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ce93af993999fe825156888d53" ON "saved_searches" USING gist ("location")
        `);
    await queryRunner.query(`
            CREATE TABLE "saved_search_alerts" (
                "saved_search_id" uuid NOT NULL,
                "listing_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d6497bb86b949b8a142fbd1074b" PRIMARY KEY ("saved_search_id", "listing_id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "preferred_city_id" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "rating_average" numeric(3, 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "rating_count" integer NOT NULL DEFAULT '0'
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f11725b1f09169c784d84212cf" ON "users" ("preferred_city_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c74f9dcb05772e4b9dea80d3a4" ON "user_devices" ("push_token")
        `);
    await queryRunner.query(`
            ALTER TABLE "conversations"
            ADD CONSTRAINT "FK_c14948d6807e84b810dd4bed949" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "conversations"
            ADD CONSTRAINT "FK_c9f0434c15cacf894e996f69088" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "conversations"
            ADD CONSTRAINT "FK_3964fc360a683d14cf0f1472751" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "favorites"
            ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "favorites"
            ADD CONSTRAINT "FK_74e0699c35d78e39b229d64f34f" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "leads"
            ADD CONSTRAINT "FK_2af9c44c5e8186db7bf72ee981b" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "leads"
            ADD CONSTRAINT "FK_16d9cef47004d4053b548d3017a" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "visits"
            ADD CONSTRAINT "FK_bfe7705c583c45fcf8a1d27edd1" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_d1cdc1ed639c70f2ec0bc33e166" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "reviews"
            ADD CONSTRAINT "FK_da74291938b03c356816a423712" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "reviews"
            ADD CONSTRAINT "FK_7efc8ac1a6389e4e9317435ad2b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "saved_searches"
            ADD CONSTRAINT "FK_8f01d13ac8e7b451d244674274f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "saved_search_alerts"
            ADD CONSTRAINT "FK_1e7ed6a52844abecc3b96bacc4f" FOREIGN KEY ("saved_search_id") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "saved_search_alerts" DROP CONSTRAINT "FK_1e7ed6a52844abecc3b96bacc4f"
        `);
    await queryRunner.query(`
            ALTER TABLE "saved_searches" DROP CONSTRAINT "FK_8f01d13ac8e7b451d244674274f"
        `);
    await queryRunner.query(`
            ALTER TABLE "reviews" DROP CONSTRAINT "FK_7efc8ac1a6389e4e9317435ad2b"
        `);
    await queryRunner.query(`
            ALTER TABLE "reviews" DROP CONSTRAINT "FK_da74291938b03c356816a423712"
        `);
    await queryRunner.query(`
            ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"
        `);
    await queryRunner.query(`
            ALTER TABLE "reports" DROP CONSTRAINT "FK_d1cdc1ed639c70f2ec0bc33e166"
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"
        `);
    await queryRunner.query(`
            ALTER TABLE "visits" DROP CONSTRAINT "FK_bfe7705c583c45fcf8a1d27edd1"
        `);
    await queryRunner.query(`
            ALTER TABLE "leads" DROP CONSTRAINT "FK_16d9cef47004d4053b548d3017a"
        `);
    await queryRunner.query(`
            ALTER TABLE "leads" DROP CONSTRAINT "FK_2af9c44c5e8186db7bf72ee981b"
        `);
    await queryRunner.query(`
            ALTER TABLE "favorites" DROP CONSTRAINT "FK_74e0699c35d78e39b229d64f34f"
        `);
    await queryRunner.query(`
            ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"
        `);
    await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"
        `);
    await queryRunner.query(`
            ALTER TABLE "conversations" DROP CONSTRAINT "FK_3964fc360a683d14cf0f1472751"
        `);
    await queryRunner.query(`
            ALTER TABLE "conversations" DROP CONSTRAINT "FK_c9f0434c15cacf894e996f69088"
        `);
    await queryRunner.query(`
            ALTER TABLE "conversations" DROP CONSTRAINT "FK_c14948d6807e84b810dd4bed949"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c74f9dcb05772e4b9dea80d3a4"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f11725b1f09169c784d84212cf"
        `);
    await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "rating_count"
        `);
    await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "rating_average"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "preferred_city_id"
        `);
    await queryRunner.query(`
            DROP TABLE "saved_search_alerts"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ce93af993999fe825156888d53"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8f01d13ac8e7b451d244674274"
        `);
    await queryRunner.query(`
            DROP TABLE "saved_searches"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e9a494c6c7484f5c9f51c4ccd7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_b539fd7cc1053583f341789dcb"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_7efc8ac1a6389e4e9317435ad2"
        `);
    await queryRunner.query(`
            DROP TABLE "reviews"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_247926e3daeab8a5d1b15edde8"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3f7f0ac8fa053c54b928ac8970"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9459b9bf907a3807ef7143d2ea"
        `);
    await queryRunner.query(`
            DROP TABLE "reports"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_310667f935698fcd8cb319113a"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e7d15e99d345ae0ffa23c58158"
        `);
    await queryRunner.query(`
            DROP TABLE "notifications"
        `);
    await queryRunner.query(`
            DROP TABLE "broadcasts"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d8ed2c37288866ed45ecc8461a"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_08a45e637a72a538cd714726a9"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_bfe7705c583c45fcf8a1d27edd"
        `);
    await queryRunner.query(`
            DROP TABLE "visits"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d41b63827432116dad3a3087d6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_47a60e02ba4c2d7a44d370ff9e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_16d9cef47004d4053b548d3017"
        `);
    await queryRunner.query(`
            DROP TABLE "leads"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_fa8b76306d731663cdaa42a335"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_74e0699c35d78e39b229d64f34"
        `);
    await queryRunner.query(`
            DROP TABLE "favorites"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8584a1974e1ca95f4861d975ff"
        `);
    await queryRunner.query(`
            DROP TABLE "messages"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d698173ca94105ede5371ae97b"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_4e8a346870493906aad7fc3656"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_bff4731395e35ab32480ad08e6"
        `);
    await queryRunner.query(`
            DROP TABLE "conversations"
        `);
  }
}
