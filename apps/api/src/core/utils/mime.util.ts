const MIME_BY_EXT: Record<string, string> = {
  js: 'application/javascript',
  hbc: 'application/javascript',
  bundle: 'application/javascript',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  lottie: 'application/json',
};

export const mimeForExtension = (ext: string): string =>
  MIME_BY_EXT[ext.replace(/^\./, '').toLowerCase()] ?? 'application/octet-stream';
