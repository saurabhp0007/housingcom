import type { BannerResponse } from '@housingcom/contracts';
import type { ImagePickerAsset } from 'expo-image-picker';
import { uploadMultipart } from '@/shared/api/upload';
import { prepareImageForUpload } from '@/shared/media/prepare-image';

/** Uploads a banner image (resized on device, then cropped to 2:1 WebP by the API). */
export async function uploadBannerImage(
  bannerId: string,
  asset: ImagePickerAsset,
  onProgress?: (fraction: number) => void,
): Promise<BannerResponse> {
  const file = await prepareImageForUpload(asset, 1600);
  return uploadMultipart<BannerResponse>(
    `/admin/content/banners/${bannerId}/image`,
    [{ field: 'image', ...file }],
    onProgress,
  );
}
