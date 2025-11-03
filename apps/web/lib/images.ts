/**
 * Convert a storage path or URL to an absolute public URL
 * Handles both relative paths from Supabase storage and already-absolute URLs
 */
export function toPublicUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  
  // Already absolute URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  
  // Convert stored path to absolute URL using NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not defined')
    return pathOrUrl
  }
  
  return `${supabaseUrl}${pathOrUrl}`
}
