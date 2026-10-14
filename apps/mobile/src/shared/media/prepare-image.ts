import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PreparedImage {
  uri: string;
  name: string;
  type: 'image/jpeg';
}

/**
 * Downscales and re-encodes a picked photo on the device before upload:
 * - a 12 MP camera photo (~5 MB) becomes ~400 KB, which is faster and cheaper on mobile data;
 * - HEIC/HEIF (iPhone) is converted to JPEG, which every server-side decoder supports.
 * The server still processes everything again; this is purely a transfer optimisation.
 */
export async function prepareImageForUpload(
  asset: { uri: string; width?: number; height?: number },
  maxSide = 2000,
): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(asset.uri);
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  if (Math.max(width, height) > maxSide) {
    context.resize(width >= height ? { width: maxSide } : { height: maxSide });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
  return { uri: result.uri, name: 'photo.jpg', type: 'image/jpeg' };
}
