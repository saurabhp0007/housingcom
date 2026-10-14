import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  Amenity,
  AuthProvider,
  FurnishingType,
  GenderPreference,
  ListerType,
  ListingType,
  SharingType,
} from '@housingcom/contracts';
import { AppModule } from '../../../app.module.js';
import type { CreateListingDto } from '../../../modules/listings/dto/listing.dto.js';
import { ListingMediaService } from '../../../modules/listings/services/listing-media.service.js';
import { ListingModerationService } from '../../../modules/listings/services/listing-moderation.service.js';
import { ListingsService } from '../../../modules/listings/services/listings.service.js';
import { UsersService } from '../../../modules/users/services/users.service.js';

/** Signs in like any user (OTP_STATIC_CODE), so the demo lister's dashboard can be explored too. */
const DEMO_OWNER_PHONE = '+919000000001';

/** Photos are Unsplash photo IDs (free to use under the Unsplash License). */
type DemoListing = Omit<CreateListingDto, 'availableFrom' | 'houseRules'> & { photos: string[] };

const { Wifi, Ac, PowerBackup, Housekeeping, Laundry, Fridge, Geyser, Lift, Parking, Tv, Gym } =
  Amenity;

/** Live demo listings across Delhi, owned by one demo lister. */
const DELHI_LISTINGS: DemoListing[] = [
  {
    type: ListingType.Pg,
    title: 'Premium boys PG near North Campus',
    description:
      'Fully furnished twin-sharing rooms a 5-minute walk from Delhi University North Campus. Three home-style meals a day, daily cleaning and 24x7 security.',
    rent: 11000,
    deposit: 11000,
    sharing: SharingType.Double,
    gender: GenderPreference.Boys,
    furnishing: FurnishingType.Furnished,
    foodIncluded: true,
    amenities: [Wifi, Ac, PowerBackup, Housekeeping, Laundry, Geyser],
    address: 'Block B, Kamla Nagar, Delhi 110007',
    location: { lat: 28.6809, lng: 77.2049 },
    photos: [
      '1631049307264-da0ec9d70304',
      '1595526114035-0d45ed16cfbf',
      '1513694203232-719a280e022f',
    ],
  },
  {
    type: ListingType.Pg,
    title: 'Girls PG with meals in Mukherjee Nagar',
    description:
      'Safe and quiet girls PG close to coaching centres and the metro. Triple and double sharing, home-cooked meals, CCTV and a resident warden.',
    rent: 8500,
    deposit: 8500,
    sharing: SharingType.Triple,
    gender: GenderPreference.Girls,
    furnishing: FurnishingType.Furnished,
    foodIncluded: true,
    amenities: [Wifi, PowerBackup, Housekeeping, Laundry, Fridge, Geyser],
    address: 'Dr Mukherjee Nagar, Delhi 110009',
    location: { lat: 28.7055, lng: 77.2037 },
    photos: [
      '1615874959474-d609969a20ed',
      '1617325247661-675ab4b64ae2',
      '1586023492125-27b2c045efd7',
    ],
  },
  {
    type: ListingType.Flat,
    title: '2 BHK apartment in Hauz Khas',
    description:
      'Bright semi-furnished 2 BHK on the second floor, walking distance from Hauz Khas Village and the Green Park metro. Modular kitchen and covered parking.',
    rent: 38000,
    deposit: 76000,
    sharing: null,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.SemiFurnished,
    foodIncluded: false,
    amenities: [Ac, PowerBackup, Parking, Lift, Geyser],
    address: 'Hauz Khas Enclave, New Delhi 110016',
    location: { lat: 28.5501, lng: 77.2025 },
    photos: ['1560448204-e02f11c3d0e2', '1484154218962-a197022b5858', '1540518614846-7eded433c457'],
  },
  {
    type: ListingType.Room,
    title: 'Private room in Lajpat Nagar',
    description:
      'Spacious single room with attached bathroom in a family-run independent house. Close to Lajpat Nagar market and the Pink Line metro.',
    rent: 14000,
    deposit: 28000,
    sharing: SharingType.Single,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.Furnished,
    foodIncluded: false,
    amenities: [Wifi, Ac, Geyser, Fridge],
    address: 'Lajpat Nagar II, New Delhi 110024',
    location: { lat: 28.5669, lng: 77.2421 },
    photos: ['1616594039964-ae9021a400a0', '1493809842364-78817add7ffb', '1556911220-bff31c812dba'],
  },
  {
    type: ListingType.Flat,
    title: '1 BHK studio near Connaught Place',
    description:
      'Compact fully furnished studio for working professionals, two minutes from Rajiv Chowk metro. Power backup, lift and housekeeping twice a week.',
    rent: 32000,
    deposit: 64000,
    sharing: null,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.Furnished,
    foodIncluded: false,
    amenities: [Wifi, Ac, PowerBackup, Lift, Housekeeping, Tv],
    address: 'Barakhamba Road, Connaught Place, New Delhi 110001',
    location: { lat: 28.6302, lng: 77.2205 },
    photos: [
      '1536376072261-38c75010e6c9',
      '1522708323590-d24dbb6b0267',
      '1617325247661-675ab4b64ae2',
    ],
  },
  {
    type: ListingType.Pg,
    title: 'Co-living PG in Karol Bagh',
    description:
      'Modern co-living with single and double rooms, a shared lounge and weekly events. Breakfast and dinner included, five minutes from Karol Bagh metro.',
    rent: 12500,
    deposit: 12500,
    sharing: SharingType.Double,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.Furnished,
    foodIncluded: true,
    amenities: [Wifi, Ac, PowerBackup, Housekeeping, Laundry, Tv],
    address: 'Pusa Road, Karol Bagh, New Delhi 110005',
    location: { lat: 28.6448, lng: 77.1905 },
    photos: ['1554995207-c18c203602cb', '1595526114035-0d45ed16cfbf', '1502672260266-1c1ef2d93688'],
  },
  {
    type: ListingType.Flat,
    title: '3 BHK family flat in Dwarka Sector 10',
    description:
      'Well-maintained 3 BHK in a gated society with park, gym and 24x7 security. Unfurnished with wardrobes, near Dwarka Sector 10 metro station.',
    rent: 30000,
    deposit: 60000,
    sharing: null,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.Unfurnished,
    foodIncluded: false,
    amenities: [Parking, Lift, PowerBackup, Gym],
    address: 'Sector 10, Dwarka, New Delhi 110075',
    location: { lat: 28.5818, lng: 77.0585 },
    photos: ['1598928506311-c55ded91a20c', '1560185007-cde436f6a4d0', '1631049307264-da0ec9d70304'],
  },
  {
    type: ListingType.Room,
    title: 'Furnished room in Saket near Select City',
    description:
      'Furnished room with balcony in a shared 3 BHK, walking distance from Select City Walk and Saket metro. Flatmates are working professionals.',
    rent: 18000,
    deposit: 36000,
    sharing: SharingType.Single,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.Furnished,
    foodIncluded: false,
    amenities: [Wifi, Ac, Fridge, Geyser, Lift],
    address: 'Saket, New Delhi 110017',
    location: { lat: 28.5262, lng: 77.2139 },
    photos: [
      '1540518614846-7eded433c457',
      '1567767292278-a4f21aa2d36e',
      '1484154218962-a197022b5858',
    ],
  },
  {
    type: ListingType.Pg,
    title: 'Budget boys PG in Laxmi Nagar',
    description:
      'Affordable triple-sharing PG for students and freshers, near Laxmi Nagar metro and coaching hubs. Meals, Wi-Fi and laundry included in rent.',
    rent: 6500,
    deposit: 6500,
    sharing: SharingType.Triple,
    gender: GenderPreference.Boys,
    furnishing: FurnishingType.Furnished,
    foodIncluded: true,
    amenities: [Wifi, PowerBackup, Laundry, Geyser],
    address: 'Vikas Marg, Laxmi Nagar, Delhi 110092',
    location: { lat: 28.6315, lng: 77.2762 },
    photos: [
      '1617325247661-675ab4b64ae2',
      '1513694203232-719a280e022f',
      '1586023492125-27b2c045efd7',
    ],
  },
  {
    type: ListingType.Flat,
    title: '2 BHK builder floor in Malviya Nagar',
    description:
      'Newly renovated 2 BHK builder floor with modular kitchen and two balconies. Quiet lane, close to Malviya Nagar metro and the market.',
    rent: 34000,
    deposit: 68000,
    sharing: null,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.SemiFurnished,
    foodIncluded: false,
    amenities: [Ac, Parking, PowerBackup, Geyser],
    address: 'Malviya Nagar, New Delhi 110017',
    location: { lat: 28.5348, lng: 77.2098 },
    photos: ['1505691938895-1758d7feb511', '1556911220-bff31c812dba', '1616594039964-ae9021a400a0'],
  },
  {
    type: ListingType.Room,
    title: 'Girls single room in Rajouri Garden',
    description:
      'Clean single room for working women in a secure independent house, with an attached washroom. Near Rajouri Garden metro and the main market.',
    rent: 13000,
    deposit: 13000,
    sharing: SharingType.Single,
    gender: GenderPreference.Girls,
    furnishing: FurnishingType.Furnished,
    foodIncluded: false,
    amenities: [Wifi, Ac, Geyser, Housekeeping],
    address: 'Rajouri Garden, New Delhi 110027',
    location: { lat: 28.6475, lng: 77.1238 },
    photos: [
      '1615874959474-d609969a20ed',
      '1493809842364-78817add7ffb',
      '1595526114035-0d45ed16cfbf',
    ],
  },
  {
    type: ListingType.Flat,
    title: 'Furnished 3 BHK in Vasant Kunj',
    description:
      'Fully furnished 3 BHK in a green society near the Ambience and DLF malls. Ideal for families or flat-sharing professionals, with 24x7 power backup.',
    rent: 55000,
    deposit: 110000,
    sharing: null,
    gender: GenderPreference.CoLiving,
    furnishing: FurnishingType.Furnished,
    foodIncluded: false,
    amenities: [Wifi, Ac, Parking, Lift, PowerBackup, Gym, Tv, Fridge],
    address: 'Sector C, Vasant Kunj, New Delhi 110070',
    location: { lat: 28.5281, lng: 77.1557 },
    photos: ['1567767292278-a4f21aa2d36e', '1560185007-cde436f6a4d0', '1616594039964-ae9021a400a0'],
  },
];

async function photo(unsplashId: string): Promise<Buffer> {
  const res = await fetch(`https://images.unsplash.com/photo-${unsplashId}?w=1600&q=80&fm=jpg`);
  if (!res.ok) throw new Error(`Photo ${unsplashId} failed: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Demo data for trying the app: live listings across Delhi with photos.
 * Idempotent: does nothing if the demo lister already has listings. `--reset` replaces them.
 */
async function run(): Promise<void> {
  const logger = new Logger('DemoSeed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const users = app.get(UsersService, { strict: false });
    const listings = app.get(ListingsService, { strict: false });
    const media = app.get(ListingMediaService, { strict: false });
    const moderation = app.get(ListingModerationService, { strict: false });

    const { user } = await users.findOrCreateByIdentity({
      authUid: `phone:${DEMO_OWNER_PHONE}`,
      phone: DEMO_OWNER_PHONE,
      email: null,
      fullName: 'Housing Demo Homes',
      avatarUrl: null,
      authProvider: AuthProvider.Phone,
    });
    if (!user.listerProfile) {
      await users.becomeLister(user.id, ListerType.PgOperator, 'Housing Demo Homes');
    }
    const existing = await listings.mine(user.id);
    if (process.argv.includes('--reset')) {
      for (const listing of existing) await listings.remove(user.id, listing.id);
    } else if (existing.length > 0) {
      logger.log('Demo listings already exist; nothing to do.');
      return;
    }

    const availableFrom = new Date().toISOString().slice(0, 10);
    for (const { photos, ...fields } of DELHI_LISTINGS) {
      const listing = await listings.create(user.id, {
        ...fields,
        availableFrom,
        houseRules: 'No smoking inside the rooms. Visitors allowed until 9 pm.',
      } as CreateListingDto);
      for (const unsplashId of photos) {
        const buffer = await photo(unsplashId);
        await media.upload(user.id, listing.id, {
          buffer,
          mimetype: 'image/jpeg',
          size: buffer.length,
        });
      }
      await listings.submit(user.id, listing.id);
      await moderation.approve(user.id, listing.id);
      logger.log(`Live: ${fields.title}`);
    }
    logger.log(`Seeded ${DELHI_LISTINGS.length} Delhi listings (owner ${DEMO_OWNER_PHONE}).`);
    // Approval notifications are handled by async listeners; let them finish before shutdown.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } finally {
    await app.close();
  }
}

await run();
