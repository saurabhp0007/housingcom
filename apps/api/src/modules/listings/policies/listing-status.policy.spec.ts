import { ListingAction as A, ListingStatus as S } from '@housingcom/contracts';
import { transition } from './listing-status.policy.js';

const verified = { isVerifiedLister: true };
const unverified = { isVerifiedLister: false };
const next = (r: ReturnType<typeof transition>) => (r.allowed ? r.next : `denied: ${r.reason}`);

describe('listing status policy', () => {
  it('sends unverified submissions to review and verified ones live', () => {
    expect(next(transition(S.Draft, A.Submit, unverified))).toBe(S.PendingApproval);
    expect(next(transition(S.Draft, A.Submit, verified))).toBe(S.Live);
  });

  it('lets admins approve or reject only pending listings', () => {
    expect(next(transition(S.PendingApproval, A.Approve, unverified))).toBe(S.Live);
    expect(next(transition(S.PendingApproval, A.Reject, unverified))).toBe(S.Rejected);
    expect(transition(S.Live, A.Approve, unverified).allowed).toBe(false);
    expect(transition(S.Draft, A.Reject, unverified).allowed).toBe(false);
  });

  it('lets a rejected listing be fixed and resubmitted', () => {
    expect(next(transition(S.Rejected, A.Edit, unverified))).toBe(S.Rejected);
    expect(next(transition(S.Rejected, A.Submit, unverified))).toBe(S.PendingApproval);
  });

  it('re-reviews edits to live listings from unverified listers only', () => {
    expect(next(transition(S.Live, A.Edit, unverified))).toBe(S.PendingApproval);
    expect(next(transition(S.Live, A.Edit, verified))).toBe(S.Live);
    expect(next(transition(S.Paused, A.Edit, unverified))).toBe(S.PendingApproval);
  });

  it('supports pause, resume and filled', () => {
    expect(next(transition(S.Live, A.Pause, unverified))).toBe(S.Paused);
    expect(next(transition(S.Paused, A.Resume, unverified))).toBe(S.Live);
    expect(next(transition(S.Live, A.MarkFilled, unverified))).toBe(S.Filled);
    expect(next(transition(S.Filled, A.Resume, unverified))).toBe(S.Live);
    expect(transition(S.Filled, A.Edit, verified).allowed).toBe(false);
    expect(transition(S.PendingApproval, A.Pause, verified).allowed).toBe(false);
  });

  it('never submits a listing twice', () => {
    expect(transition(S.PendingApproval, A.Submit, verified).allowed).toBe(false);
    expect(transition(S.Live, A.Submit, verified).allowed).toBe(false);
  });
});
