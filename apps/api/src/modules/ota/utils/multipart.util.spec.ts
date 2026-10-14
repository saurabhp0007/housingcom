import { buildMultipartMixed, parseStructuredStringList } from './multipart.util.js';

describe('buildMultipartMixed', () => {
  it('produces a well-formed multipart/mixed body with named parts', () => {
    const { body, contentType } = buildMultipartMixed([
      {
        name: 'manifest',
        body: '{"id":"1"}',
        headers: { 'expo-signature': 'sig="x", keyid="main"' },
      },
      { name: 'extensions', body: '{}' },
    ]);
    const boundary = contentType.split('boundary=')[1]!;

    expect(contentType).toMatch(/^multipart\/mixed; boundary=expo-[a-f0-9]+$/);
    expect(body.startsWith(`--${boundary}\r\n`)).toBe(true);
    expect(body.endsWith(`--${boundary}--\r\n`)).toBe(true);
    expect(body).toContain('content-disposition: form-data; name="manifest"');
    expect(body).toContain('expo-signature: sig="x", keyid="main"\r\n\r\n{"id":"1"}\r\n');
    expect(body.split(`--${boundary}\r\n`)).toHaveLength(3);
  });
});

describe('parseStructuredStringList', () => {
  it('parses the Expo-Recent-Failed-Update-IDs header', () => {
    expect(parseStructuredStringList('"a1", "b2"')).toEqual(['a1', 'b2']);
    expect(parseStructuredStringList(undefined)).toEqual([]);
  });
});
