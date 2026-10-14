import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Sign-in identities are no longer Firebase UIDs: `firebase_uid` becomes `auth_uid`. */
export class PhoneOtpAuth1791990000000 implements MigrationInterface {
  name = 'PhoneOtpAuth1791990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0fd54ced5cc75f7cb92925dd80"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "firebase_uid" TO "auth_uid"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_395733b8469965e10653e720f4" ON "users" ("auth_uid")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_395733b8469965e10653e720f4"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "auth_uid" TO "firebase_uid"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0fd54ced5cc75f7cb92925dd80" ON "users" ("firebase_uid")`,
    );
  }
}
