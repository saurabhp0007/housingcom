import AdmZip from 'adm-zip';
import { AppException } from '../../../core/errors/app.exception.js';
import { OtaBundleParserService } from './ota-bundle-parser.service.js';

function makeZip(files: Record<string, string>, prefix = ''): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files))
    zip.addFile(prefix + name, Buffer.from(content));
  return zip.toBuffer();
}

const validFiles = {
  'metadata.json': JSON.stringify({
    version: 0,
    bundler: 'metro',
    fileMetadata: {
      android: {
        bundle: '_expo/static/js/android/entry-abc.hbc',
        assets: [{ path: 'assets/f00', ext: 'png' }],
      },
    },
  }),
  'ota.json': JSON.stringify({ runtimeVersions: { android: 'fp-123' }, gitCommit: 'deadbeef' }),
  'expoConfig.json': JSON.stringify({ name: 'Housing', slug: 'housing' }),
  '_expo/static/js/android/entry-abc.hbc': 'bundle-bytes',
  'assets/f00': 'png-bytes',
};

describe('OtaBundleParserService', () => {
  const parser = new OtaBundleParserService();

  it('parses an expo export archive', () => {
    const parsed = parser.parse(makeZip(validFiles));
    expect(parsed.gitCommit).toBe('deadbeef');
    expect(parsed.platforms).toHaveLength(1);
    expect(parsed.platforms[0]).toMatchObject({ platform: 'android', runtimeVersion: 'fp-123' });
    expect(parsed.platforms[0]!.bundle.toString()).toBe('bundle-bytes');
    expect(parsed.platforms[0]!.assets[0]).toMatchObject({ ext: 'png' });
  });

  it('accepts archives with a top-level folder', () => {
    expect(parser.parse(makeZip(validFiles, 'dist/')).platforms).toHaveLength(1);
  });

  it('rejects a bundle missing its runtime version', () => {
    const files = { ...validFiles, 'ota.json': JSON.stringify({ runtimeVersions: {} }) };
    expect(() => parser.parse(makeZip(files))).toThrow(AppException);
  });

  it('rejects a bundle referencing a missing file', () => {
    const { ['assets/f00']: _removed, ...files } = validFiles;
    expect(() => parser.parse(makeZip(files))).toThrow(/Missing file in bundle: assets\/f00/);
  });

  it('rejects non-zip uploads', () => {
    expect(() => parser.parse(Buffer.from('not a zip'))).toThrow(AppException);
  });
});
