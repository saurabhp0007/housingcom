export const UserRole = {
  Customer: 'customer',
  Lister: 'lister',
  Admin: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ListerType = {
  Owner: 'owner',
  Dealer: 'dealer',
  PgOperator: 'pg_operator',
} as const;
export type ListerType = (typeof ListerType)[keyof typeof ListerType];

export const UserStatus = {
  Active: 'active',
  Blocked: 'blocked',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AuthProvider = {
  Phone: 'phone',
  Google: 'google',
  Apple: 'apple',
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
