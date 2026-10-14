export const ListingType = {
  Room: 'room',
  Flat: 'flat',
  Pg: 'pg',
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

export const SharingType = {
  Single: 'single',
  Double: 'double',
  Triple: 'triple',
} as const;
export type SharingType = (typeof SharingType)[keyof typeof SharingType];

export const GenderPreference = {
  Boys: 'boys',
  Girls: 'girls',
  CoLiving: 'co_living',
} as const;
export type GenderPreference = (typeof GenderPreference)[keyof typeof GenderPreference];

export const ListingStatus = {
  Draft: 'draft',
  PendingApproval: 'pending_approval',
  Live: 'live',
  Rejected: 'rejected',
  Paused: 'paused',
  Filled: 'filled',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const FurnishingType = {
  Furnished: 'furnished',
  SemiFurnished: 'semi_furnished',
  Unfurnished: 'unfurnished',
} as const;
export type FurnishingType = (typeof FurnishingType)[keyof typeof FurnishingType];

export const MediaKind = {
  Image: 'image',
  Video: 'video',
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

/** Actions a lister or admin can take on a listing (see the API's listing status policy). */
export const ListingAction = {
  Submit: 'submit',
  Edit: 'edit',
  Approve: 'approve',
  Reject: 'reject',
  Pause: 'pause',
  Resume: 'resume',
  MarkFilled: 'mark_filled',
} as const;
export type ListingAction = (typeof ListingAction)[keyof typeof ListingAction];

export const ListingSort = {
  Recommended: 'recommended',
  Nearest: 'nearest',
  Newest: 'newest',
  MostViewed: 'most_viewed',
} as const;
export type ListingSort = (typeof ListingSort)[keyof typeof ListingSort];

export const Amenity = {
  Wifi: 'wifi',
  Ac: 'ac',
  Parking: 'parking',
  Laundry: 'laundry',
  PowerBackup: 'power_backup',
  Housekeeping: 'housekeeping',
  Tv: 'tv',
  Fridge: 'fridge',
  WashingMachine: 'washing_machine',
  Geyser: 'geyser',
  Gym: 'gym',
  Lift: 'lift',
  Security: 'security',
  Cctv: 'cctv',
  AttachedBathroom: 'attached_bathroom',
  Balcony: 'balcony',
  Kitchen: 'kitchen',
  WaterPurifier: 'water_purifier',
} as const;
export type Amenity = (typeof Amenity)[keyof typeof Amenity];

/** Display labels shared by the app and admin screens. */
export const AMENITY_LABELS: Record<Amenity, string> = {
  wifi: 'Wi-Fi',
  ac: 'AC',
  parking: 'Parking',
  laundry: 'Laundry',
  power_backup: 'Power backup',
  housekeeping: 'Housekeeping',
  tv: 'TV',
  fridge: 'Fridge',
  washing_machine: 'Washing machine',
  geyser: 'Geyser',
  gym: 'Gym',
  lift: 'Lift',
  security: 'Security',
  cctv: 'CCTV',
  attached_bathroom: 'Attached bathroom',
  balcony: 'Balcony',
  kitchen: 'Kitchen',
  water_purifier: 'RO water',
};

export const LISTING_LIMITS = {
  maxImages: 15,
  maxVideos: 1,
  minImagesToSubmit: 1,
  maxImageBytes: 15 * 1024 * 1024,
  maxVideoBytes: 60 * 1024 * 1024,
} as const;

/** User actions that feed the recommendation engine ("learns from activity"). */
export const ListingEventType = {
  View: 'view',
  Share: 'share',
  Save: 'save',
  Contact: 'contact',
} as const;
export type ListingEventType = (typeof ListingEventType)[keyof typeof ListingEventType];

export const NearbyPlaceCategory = {
  Metro: 'metro',
  BusStop: 'bus_stop',
  College: 'college',
  Hospital: 'hospital',
} as const;
export type NearbyPlaceCategory = (typeof NearbyPlaceCategory)[keyof typeof NearbyPlaceCategory];

export const NEARBY_PLACE_LABELS: Record<NearbyPlaceCategory, string> = {
  metro: 'Metro',
  bus_stop: 'Bus stop',
  college: 'College',
  hospital: 'Hospital',
};
