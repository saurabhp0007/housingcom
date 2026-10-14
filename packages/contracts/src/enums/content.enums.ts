export const ContentPageSlug = {
  Terms: 'terms',
  Privacy: 'privacy',
  About: 'about',
} as const;
export type ContentPageSlug = (typeof ContentPageSlug)[keyof typeof ContentPageSlug];

export const CONTENT_PAGE_TITLES: Record<ContentPageSlug, string> = {
  terms: 'Terms of use',
  privacy: 'Privacy policy',
  about: 'About us',
};
