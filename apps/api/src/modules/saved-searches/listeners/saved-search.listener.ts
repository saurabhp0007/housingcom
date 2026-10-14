import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ListingStatus } from '@housingcom/contracts';
import { ListingEvent, type ListingStatusEvent } from '../../../core/events/domain-events.js';
import { SavedSearchAlertsService } from '../services/saved-search-alerts.service.js';

@Injectable()
export class SavedSearchListener {
  private readonly logger = new Logger(SavedSearchListener.name);

  constructor(private readonly alerts: SavedSearchAlertsService) {}

  /** Any listing that becomes live (approved, auto-published, resumed) may match. Dedupe is per listing. */
  @OnEvent(ListingEvent.StatusChanged, { async: true })
  async onStatusChanged(event: ListingStatusEvent): Promise<void> {
    if (event.to !== ListingStatus.Live || event.from === ListingStatus.Live) return;
    await this.alerts
      .schedule(event.listingId)
      .catch((err) => this.logger.warn({ err }, 'Saved-search matching not scheduled'));
  }
}
