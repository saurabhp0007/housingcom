import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { PlaceDetails, PlaceSuggestion } from '@housingcom/contracts';
import { Public } from '../../../core/http/decorators/index.js';
import { PlaceDetailsQueryDto, PlacesAutocompleteQueryDto } from '../dto/places-query.dto.js';
import { PlacesService } from '../services/places.service.js';

@ApiTags('Places')
@Public()
@Throttle({ default: { limit: 90, ttl: 60_000 } })
@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  /** Areas, landmarks, colleges and offices matching the text, biased to the user's location. */
  @Get('autocomplete')
  autocomplete(@Query() q: PlacesAutocompleteQueryDto): Promise<PlaceSuggestion[]> {
    const bias =
      q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : undefined;
    return this.places.autocomplete(q.q, bias, q.sessionToken);
  }

  /** Coordinates for a Google suggestion (our own areas already include them). */
  @Get(':placeId')
  details(
    @Param('placeId') placeId: string,
    @Query() q: PlaceDetailsQueryDto,
  ): Promise<PlaceDetails> {
    return this.places.details(placeId, q.sessionToken);
  }
}
