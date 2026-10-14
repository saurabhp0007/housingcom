import type { Paginated, ReportStatus } from '@housingcom/contracts';
import type { Report } from '../entities/report.entity.js';

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');

export interface ReportsRepository {
  create(data: Pick<Report, 'listingId' | 'reporterId' | 'reason' | 'details'>): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  hasOpen(listingId: string, reporterId: string): Promise<boolean>;
  /** Oldest first for open reports (FIFO queue), newest first otherwise. */
  pageByStatus(status: ReportStatus, page: number, limit: number): Promise<Paginated<Report>>;
  openCountsByListing(listingIds: string[]): Promise<Map<string, number>>;
  countByStatus(status: ReportStatus): Promise<number>;
  resolve(
    id: string,
    data: Pick<Report, 'status' | 'resolutionNote' | 'resolvedBy' | 'resolvedAt'>,
  ): Promise<void>;
  /** Closes every open report on a listing (after it was taken down). */
  resolveOpenForListing(
    listingId: string,
    data: Pick<Report, 'status' | 'resolutionNote' | 'resolvedBy' | 'resolvedAt'>,
  ): Promise<void>;
}
