// Build a full public URL for storage objects.
// Accepts either a full https URL or a relative path like
// "/storage/v1/object/public/product-images/ring-1.jpg"
export function toPublicUrl(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const p = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${p}`;
}
