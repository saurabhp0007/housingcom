import { NotificationType, VisitStatus } from '@housingcom/contracts';
import { NotificationTemplates as T } from './notification-templates.js';

describe('NotificationTemplates', () => {
  it('links listing outcomes to the right screens', () => {
    expect(T.listingApproved('l1', 'Cosy room').url).toBe('/listing/l1');
    expect(T.listingRejected('l1', 'Cosy room', 'Blurry photos')).toMatchObject({
      url: '/listing-editor/l1',
      body: expect.stringContaining('Blurry photos'),
    });
  });

  it('words visit updates by status and audience', () => {
    const confirmed = T.visitUpdated(VisitStatus.Confirmed, 'PG', '2026-03-14', 'evening');
    expect(confirmed.title).toBe('Visit confirmed');
    expect(confirmed.url).toBe('/visits');
    expect(confirmed.body).toContain('Sat, 14 Mar');
    expect(T.visitUpdated(VisitStatus.Cancelled, 'PG', '2026-03-14', 'evening').url).toBe(
      '/lister/leads',
    );
  });

  it('truncates chat previews and falls back to generic names', () => {
    const n = T.newMessage('c1', null, 'x'.repeat(300));
    expect(n.type).toBe(NotificationType.NewMessage);
    expect(n.title).toBe('New message');
    expect(n.body.length).toBe(140);
  });
});
