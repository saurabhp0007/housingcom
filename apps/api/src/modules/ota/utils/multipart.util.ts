import { randomBytes } from 'node:crypto';

export interface MultipartPart {
  name: 'manifest' | 'directive' | 'extensions';
  body: string;
  headers?: Record<string, string>;
}

/** Builds the multipart/mixed body expo-updates expects (protocol v1). */
export function buildMultipartMixed(parts: MultipartPart[]): { body: string; contentType: string } {
  const boundary = `expo-${randomBytes(12).toString('hex')}`;
  const chunks = parts.map((part) => {
    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `form-data; name="${part.name}"`,
      ...part.headers,
    };
    const headerLines = Object.entries(headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');
    return `--${boundary}\r\n${headerLines}\r\n\r\n${part.body}\r\n`;
  });
  return {
    body: `${chunks.join('')}--${boundary}--\r\n`,
    contentType: `multipart/mixed; boundary=${boundary}`,
  };
}

/** Parses an RFC 8941 structured-field list of strings, e.g. `"a", "b"`. */
export function parseStructuredStringList(value: string | undefined): string[] {
  if (!value) return [];
  return Array.from(value.matchAll(/"([^"\\]*)"/g), (m) => m[1]!).filter(Boolean);
}
