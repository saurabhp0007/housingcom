import { LISTING_LIMITS, type ListingMediaResponse } from '@housingcom/contracts';
import type { ImagePickerAsset } from 'expo-image-picker';
import { uploadMultipart, UploadError } from '@/shared/api/upload';
import { prepareImageForUpload } from '@/shared/media/prepare-image';

/** Client-side guard so users don't wait for an upload the server will refuse. */
export function validateAsset(asset: ImagePickerAsset): string | null {
  const isVideo = asset.type === 'video';
  // Photos are downscaled on the device first, so only videos can realistically exceed the limit.
  const max = isVideo ? LISTING_LIMITS.maxVideoBytes : Number.POSITIVE_INFINITY;
  if (asset.fileSize && asset.fileSize > max) {
    return `${isVideo ? 'Video' : 'Photo'} is larger than ${Math.round(max / 1048576)} MB`;
  }
  return null;
}

export async function uploadListingAsset(
  listingId: string,
  asset: ImagePickerAsset,
  onProgress: (fraction: number) => void,
): Promise<ListingMediaResponse> {
  const file =
    asset.type === 'video'
      ? { uri: asset.uri, name: asset.fileName ?? 'video.mp4', type: asset.mimeType ?? 'video/mp4' }
      : await prepareImageForUpload(asset);
  return uploadMultipart<ListingMediaResponse>(
    `/me/listings/${listingId}/media`,
    [{ field: 'file', ...file }],
    onProgress,
  );
}

export { UploadError };
