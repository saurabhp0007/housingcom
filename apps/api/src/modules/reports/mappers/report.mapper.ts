import type { ListingCardResponse, ReportResponse } from '@housingcom/contracts';
import type { Report } from '../entities/report.entity.js';

export function toReportResponse(
  r: Report,
  listing: ListingCardResponse,
  openReportsOnListing: number,
): ReportResponse {
  return {
    id: r.id,
    listing,
    reason: r.reason,
    details: r.details,
    status: r.status,
    reporter: { id: r.reporterId, name: r.reporter?.fullName ?? null },
    resolutionNote: r.resolutionNote,
    createdAt: r.createdAt.toISOString(),
    openReportsOnListing,
  };
}
