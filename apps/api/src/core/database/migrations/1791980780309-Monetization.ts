import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 5: featured plans and periods, payments, listing featured columns, app content. */
export class Monetization1791980780309 implements MigrationInterface {
  name = 'Monetization1791980780309';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "banners" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying(80) NOT NULL,
                "subtitle" character varying(160),
                "image_key" character varying(255),
                "link_url" character varying(255),
                "city_id" uuid,
                "starts_at" TIMESTAMP WITH TIME ZONE,
                "ends_at" TIMESTAMP WITH TIME ZONE,
                "is_active" boolean NOT NULL DEFAULT true,
                "sort_order" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_e9b186b959296fcb940790d31c3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_aff31b147183bf6f729a519976" ON "banners" ("is_active", "sort_order")
        `);
    await queryRunner.query(`
            CREATE TABLE "content_pages" (
                "slug" character varying(32) NOT NULL,
                "title" character varying(100) NOT NULL,
                "body" text NOT NULL,
                "updated_by" uuid,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cc23a46df001843d70d6c3c650c" PRIMARY KEY ("slug")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "faqs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "question" character varying(200) NOT NULL,
                "answer" text NOT NULL,
                "sort_order" integer NOT NULL DEFAULT '0',
                "is_published" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_2ddf4f2c910f8e8fa2663a67bf0" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_93a07dd24b4da18b4811cc781e" ON "faqs" ("is_published", "sort_order")
        `);
    await queryRunner.query(`
            CREATE TABLE "featured_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying(60) NOT NULL,
                "duration_days" integer NOT NULL,
                "price_inr" integer NOT NULL,
                "city_id" uuid,
                "area_id" uuid,
                "max_slots_per_area" integer,
                "is_active" boolean NOT NULL DEFAULT true,
                "sort_order" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_2cdf07f1628c1cfa7dc7c82b41c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_75a399963da092ac6213cc6b9c" ON "featured_plans" ("city_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8618ac5bf6a5f56647e3e66b77" ON "featured_plans" ("area_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_57af4fa9c44dd6a804f3e1fa2a" ON "featured_plans" ("is_active", "sort_order")
        `);
    await queryRunner.query(`
            CREATE TABLE "listing_features" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "listing_id" uuid NOT NULL,
                "owner_id" uuid NOT NULL,
                "area_id" uuid,
                "status" character varying(12) NOT NULL DEFAULT 'active',
                "source" character varying(12) NOT NULL,
                "pinned" boolean NOT NULL DEFAULT false,
                "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "paused_at" TIMESTAMP WITH TIME ZONE,
                "plan_name" character varying(60),
                "impressions" integer NOT NULL DEFAULT '0',
                "views" integer NOT NULL DEFAULT '0',
                "leads" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_88e4fe3e46d21d8b4fdadeb7599" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b24fb66630718a78eca13bec03" ON "listing_features" ("owner_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ea7e7cab4eadfdc805ec26d9cc" ON "listing_features" ("area_id", "status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6d080aa2a2dca69eb979588c29" ON "listing_features" ("status", "ends_at")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_eb8ecbb657b19032f8619f8259" ON "listing_features" ("listing_id")
            WHERE status IN ('active', 'paused')
        `);
    await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "purpose" character varying(32) NOT NULL,
                "reference_id" uuid,
                "description" character varying(160) NOT NULL,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "amount_paise" integer NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "status" character varying(12) NOT NULL DEFAULT 'created',
                "driver" character varying(12) NOT NULL,
                "gateway_order_id" character varying(64) NOT NULL,
                "gateway_payment_id" character varying(64),
                "failure_reason" character varying(300),
                "paid_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5dbcfbeacb63bef928ce5bed11" ON "payments" ("reference_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_1ad3c43e0487e4036cf8b357e0" ON "payments" ("gateway_order_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_1e4447ccf2f39b5d0a7baf1cce" ON "payments" ("status", "paid_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8eac494f9f6215a0e65c0135bb" ON "payments" ("user_id", "created_at")
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "featured_until" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "featured_pinned" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b296e9631b8d89c5bd563d45ef" ON "listings" ("featured_until")
        `);
    await queryRunner.query(`
            ALTER TABLE "featured_plans"
            ADD CONSTRAINT "FK_75a399963da092ac6213cc6b9ce" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "featured_plans"
            ADD CONSTRAINT "FK_8618ac5bf6a5f56647e3e66b779" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_features"
            ADD CONSTRAINT "FK_ca8600e0292557b09c3bd0cba75" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_features" DROP CONSTRAINT "FK_ca8600e0292557b09c3bd0cba75"
        `);
    await queryRunner.query(`
            ALTER TABLE "featured_plans" DROP CONSTRAINT "FK_8618ac5bf6a5f56647e3e66b779"
        `);
    await queryRunner.query(`
            ALTER TABLE "featured_plans" DROP CONSTRAINT "FK_75a399963da092ac6213cc6b9ce"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_b296e9631b8d89c5bd563d45ef"
        `);
    await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "featured_pinned"
        `);
    await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "featured_until"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8eac494f9f6215a0e65c0135bb"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_1e4447ccf2f39b5d0a7baf1cce"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_1ad3c43e0487e4036cf8b357e0"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5dbcfbeacb63bef928ce5bed11"
        `);
    await queryRunner.query(`
            DROP TABLE "payments"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_eb8ecbb657b19032f8619f8259"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6d080aa2a2dca69eb979588c29"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ea7e7cab4eadfdc805ec26d9cc"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_b24fb66630718a78eca13bec03"
        `);
    await queryRunner.query(`
            DROP TABLE "listing_features"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_57af4fa9c44dd6a804f3e1fa2a"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8618ac5bf6a5f56647e3e66b77"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_75a399963da092ac6213cc6b9c"
        `);
    await queryRunner.query(`
            DROP TABLE "featured_plans"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_93a07dd24b4da18b4811cc781e"
        `);
    await queryRunner.query(`
            DROP TABLE "faqs"
        `);
    await queryRunner.query(`
            DROP TABLE "content_pages"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_aff31b147183bf6f729a519976"
        `);
    await queryRunner.query(`
            DROP TABLE "banners"
        `);
  }
}
