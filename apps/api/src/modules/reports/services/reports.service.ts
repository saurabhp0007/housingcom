import { Inject, Injectable } from '@nestjs/common';
import {
  ReportStatus,
  type Paginated,
  type ReportListingInput,
  type ReportResponse,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import { ListingModerationService } from '../../listings/services/listing-moderation.service.js';
import type { Report } from '../entities/report.entity.js';
import {
  REPORTS_REPOSITORY,
  type ReportsRepository,
} from '../interfaces/reports-repository.interface.js';
import { toReportResponse } from '../mappers/report.mapper.js';

/** User reports on listings (PRD: "Report listing") and the admin review queue. */
@Injectable()
export class ReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY) private readonly reports: ReportsRepository,
    private readonly catalog: ListingCatalogService,
    private readonly moderation: ListingModerationService,
  ) {}

  async report(reporterId: string, listingId: string, input: ReportListingInput): Promise<void> {
    const listing = await this.catalog.getLive(listingId);
    if (listing.ownerId === reporterId) {
      throw AppException.badRequest(ErrorCode.CannotEngageOwnListing, 'This is your own listing');
    }
    if (await this.reports.hasOpen(listingId, reporterId)) {
      throw AppException.conflict(ErrorCode.ReportAlreadyOpen, 'You already reported this listing');
    }
    await this.reports.create({
      listingId,
      reporterId,
      reason: input.reason,
      details: input.details || null,
    });
  }

  async queue(
    status: ReportStatus,
    page: number,
    limit: number,
  ): Promise<Paginated<ReportResponse>> {
    const { items, meta } = await this.reports.pageByStatus(status, page, limit);
    return { items: await this.toResponses(items), meta };
  }

  countOpen(): Promise<number> {
    return this.reports.countByStatus(ReportStatus.Open);
  }

  async dismiss(adminId: string, id: string, note: string | undefined): Promise<ReportResponse> {
    const report = await this.openReport(id);
    await this.reports.resolve(id, {
      status: ReportStatus.Dismissed,
      resolutionNote: note || null,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    });
    return this.single(report.id);
  }

  /** Takes the listing down and closes every open report on it. */
  async removeListing(adminId: string, id: string, reason: string): Promise<ReportResponse> {
    const report = await this.openReport(id);
    await this.moderation.remove(adminId, report.listingId, reason);
    await this.reports.resolveOpenForListing(report.listingId, {
      status: ReportStatus.Actioned,
      resolutionNote: reason,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    });
    return this.single(report.id);
  }

  private async openReport(id: string): Promise<Report> {
    const report = await this.reports.findById(id);
    if (!report) throw AppException.notFound('Report');
    if (report.status !== ReportStatus.Open) {
      throw AppException.conflict(ErrorCode.ReportNotOpen, `Report already ${report.status}`);
    }
    return report;
  }

  private async single(id: string): Promise<ReportResponse> {
    const report = await this.reports.findById(id);
    if (!report) throw AppException.notFound('Report');
    const [response] = await this.toResponses([report]);
    if (!response) throw AppException.notFound('Listing');
    return response;
  }

  private async toResponses(reports: Report[]): Promise<ReportResponse[]> {
    const ids = reports.map((r) => r.listingId);
    const [cards, openCounts] = await Promise.all([
      this.catalog.cards(ids),
      this.reports.openCountsByListing(ids),
    ]);
    return reports.flatMap((r) => {
      const card = cards.get(r.listingId);
      return card ? [toReportResponse(r, card, openCounts.get(r.listingId) ?? 0)] : [];
    });
  }
}
