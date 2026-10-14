import { ListingAction, ListingStatus } from '@housingcom/contracts';

export interface TransitionContext {
  /** Verified listers skip the approval queue (PRD §4 "How a listing goes live"). */
  isVerifiedLister: boolean;
}

export type TransitionResult =
  { allowed: true; next: ListingStatus } | { allowed: false; reason: string };

const S = ListingStatus;
const A = ListingAction;

const goLiveOrReview = (ctx: TransitionContext) =>
  ctx.isVerifiedLister ? S.Live : S.PendingApproval;

/**
 * The listing lifecycle as a pure function:
 *
 *   draft ──submit──▶ (verified ? live : pending_approval)
 *   pending_approval ──approve──▶ live      ──reject(reason)──▶ rejected
 *   rejected ──submit──▶ (verified ? live : pending_approval)   (lister fixes and resubmits)
 *   live ⇄ paused (pause / resume)          live | paused ──mark_filled──▶ filled ──resume──▶ live
 *   any ──remove(reason, admin)──▶ removed ──submit──▶ pending_approval (always re-reviewed)
 *   edit: allowed except while filled; editing a live/paused listing as an unverified lister
 *         sends it back to review so unreviewed content never goes live.
 */
export function transition(
  current: ListingStatus,
  action: ListingAction,
  ctx: TransitionContext,
): TransitionResult {
  const deny = (reason: string): TransitionResult => ({ allowed: false, reason });
  const to = (next: ListingStatus): TransitionResult => ({ allowed: true, next });

  switch (action) {
    case A.Submit:
      // A removed listing can be fixed and resubmitted, but always goes through review again.
      if (current === S.Removed) return to(S.PendingApproval);
      if (current === S.Draft || current === S.Rejected) return to(goLiveOrReview(ctx));
      return deny('Only drafts or rejected listings can be submitted');

    case A.Edit:
      if (current === S.Filled) return deny('Relist the property before editing it');
      if ((current === S.Live || current === S.Paused) && !ctx.isVerifiedLister)
        return to(S.PendingApproval);
      return to(current);

    case A.Approve:
      return current === S.PendingApproval
        ? to(S.Live)
        : deny('Only listings awaiting approval can be approved');

    case A.Reject:
      return current === S.PendingApproval
        ? to(S.Rejected)
        : deny('Only listings awaiting approval can be rejected');

    case A.Pause:
      return current === S.Live ? to(S.Paused) : deny('Only live listings can be paused');

    case A.Resume:
      return current === S.Paused || current === S.Filled
        ? to(S.Live)
        : deny('Only paused or filled listings can be resumed');

    case A.MarkFilled:
      return current === S.Live || current === S.Paused
        ? to(S.Filled)
        : deny('Only live or paused listings can be marked filled');

    case A.Remove:
      return current === S.Removed ? deny('Listing is already removed') : to(S.Removed);
  }
}

/** Statuses the public can see. */
export const PUBLIC_STATUSES: readonly ListingStatus[] = [S.Live];
