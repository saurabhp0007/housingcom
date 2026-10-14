import { Column, Entity, Index, OneToOne, type Relation } from 'typeorm';
import { AuthProvider, UserRole, UserStatus } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { ListerProfile } from './lister-profile.entity.js';

@Entity('users')
export class User extends BaseEntity {
  /** Firebase Auth UID: the identity behind phone OTP, Google and Apple sign-in. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  firebaseUid: string;

  @Index({ unique: true, where: 'phone IS NOT NULL' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Index()
  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'text', array: true, default: () => `'{${UserRole.Customer}}'` })
  roles: UserRole[];

  @Column({ type: 'varchar', length: 16, default: UserStatus.Active })
  status: UserStatus;

  @Column({ type: 'varchar', length: 16 })
  authProvider: AuthProvider;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  /** City the user browses; targets city-wide announcements. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  preferredCityId: string | null;

  @OneToOne(() => ListerProfile, (profile) => profile.user)
  listerProfile?: Relation<ListerProfile> | null;
}
