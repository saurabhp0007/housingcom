import { LISTING_LIMITS, type ListingMediaResponse } from '@housingcom/contracts';
import type { ImagePickerAsset } from 'expo-image-picker';
import { uploadMultipart, UploadError } from '@/shared/api/upload';

/** Client-side guard so users don't wait for an upload the server will refuse. */
export function validateAsset(asset: ImagePickerAsset): string | null {
  const isVideo = asset.type === 'video';
  const max = isVideo ? LISTING_LIMITS.maxVideoBytes : LISTING_LIMITS.maxImageBytes;
  if (asset.fileSize && asset.fileSize > max) {
    return `${isVideo ? 'Video' : 'Photo'} is larger than ${Math.round(max / 1048576)} MB`;
  }
  return null;
}

export function uploadListingAsset(
  listingId: string,
  asset: ImagePickerAsset,
  onProgress: (fraction: number) => void,
): Promise<ListingMediaResponse> {
  const isVideo = asset.type === 'video';
  const type = asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg');
  const name = asset.fileName ?? `upload.${isVideo ? 'mp4' : 'jpg'}`;
  return uploadMultipart<ListingMediaResponse>(
    `/me/listings/${listingId}/media`,
    [{ field: 'file', uri: asset.uri, name, type }],
    onProgress,
  );
}

export { UploadError };
