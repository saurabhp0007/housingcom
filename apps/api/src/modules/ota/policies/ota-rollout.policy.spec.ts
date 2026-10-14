import { decideUpdate, isInRollout, rolloutBucket, shouldAutoPause } from './ota-rollout.policy.js';

const update = (id: string, rolloutPercent = 100, minutesAgo = 0) => ({
  id,
  rolloutPercent,
  createdAt: new Date(Date.now() - minutesAgo * 60_000),
});

const client = (overrides: Partial<Parameters<typeof decideUpdate>[1]> = {}) => ({
  clientId: 'device-1',
  currentUpdateId: null,
  embeddedUpdateId: 'embedded',
  recentFailedUpdateIds: [],
  ...overrides,
});

describe('rollout bucketing', () => {
  it('is deterministic per device and update', () => {
    expect(rolloutBucket('d1', 'u1')).toBe(rolloutBucket('d1', 'u1'));
  });

  it('honours 0% and 100%', () => {
    expect(isInRollout('d1', 'u1', 100)).toBe(true);
    expect(isInRollout('d1', 'u1', 0)).toBe(false);
  });

  it('includes roughly the requested share of devices', () => {
    const devices = Array.from({ length: 5000 }, (_, i) => `device-${i}`);
    const included = devices.filter((d) => isInRollout(d, 'update-x', 20)).length;
    expect(included / devices.length).toBeGreaterThan(0.17);
    expect(included / devices.length).toBeLessThan(0.23);
  });
});

describe('decideUpdate', () => {
  it('serves the newest active update', () => {
    const decision = decideUpdate([update('new'), update('old', 100, 60)], client());
    expect(decision).toEqual({ kind: 'update', update: expect.objectContaining({ id: 'new' }) });
  });

  it('reports no update when the device already runs the newest one', () => {
    expect(decideUpdate([update('new')], client({ currentUpdateId: 'new' }))).toEqual({
      kind: 'noUpdateAvailable',
    });
  });

  it('skips updates that crashed on this device and falls back to the previous one', () => {
    const decision = decideUpdate(
      [update('bad'), update('good', 100, 60)],
      client({ recentFailedUpdateIds: ['bad'] }),
    );
    expect(decision).toMatchObject({ kind: 'update', update: { id: 'good' } });
  });

  it('skips staged updates the device is not rolled out to', () => {
    const decision = decideUpdate([update('staged', 0), update('stable', 100, 60)], client());
    expect(decision).toMatchObject({ kind: 'update', update: { id: 'stable' } });
  });

  it('rolls back to the embedded bundle when the running update was pulled', () => {
    expect(decideUpdate([], client({ currentUpdateId: 'pulled' }))).toEqual({
      kind: 'rollBackToEmbedded',
    });
  });

  it('does not roll back a device already on the embedded bundle', () => {
    expect(decideUpdate([], client({ currentUpdateId: 'embedded' }))).toEqual({
      kind: 'noUpdateAvailable',
    });
  });

  it('keeps a device on its current update while a newer staged update excludes it', () => {
    const decision = decideUpdate(
      [update('staged', 0), update('current', 100, 60)],
      client({ currentUpdateId: 'current' }),
    );
    expect(decision).toEqual({ kind: 'noUpdateAvailable' });
  });
});

describe('shouldAutoPause', () => {
  const thresholds = { crashRate: 0.2, minLaunches: 50 };

  it('waits for enough launches', () => {
    expect(shouldAutoPause({ launchCount: 10, crashCount: 10 }, thresholds)).toBe(false);
  });

  it('pauses when the crash rate crosses the threshold', () => {
    expect(shouldAutoPause({ launchCount: 100, crashCount: 25 }, thresholds)).toBe(true);
    expect(shouldAutoPause({ launchCount: 100, crashCount: 5 }, thresholds)).toBe(false);
  });
});
