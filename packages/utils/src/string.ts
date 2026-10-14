/** URL-safe slug: "HSR Layout, Sector 2" -> "hsr-layout-sector-2". */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Masks a phone number for display: +91******3210. */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const visiblePrefix = phone.startsWith('+') ? 3 : 0;
  return (
    phone.slice(0, visiblePrefix) + '*'.repeat(phone.length - visiblePrefix - 4) + phone.slice(-4)
  );
}
