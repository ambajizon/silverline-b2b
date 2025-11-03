'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

interface AdminLogoUploaderProps {
  resellerId: string
  userId: string
  currentUrl: string | null
  shopName: string
}

export default function AdminLogoUploader({ 
  resellerId, 
  userId, 
  currentUrl, 
  shopName 
}: AdminLogoUploaderProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please select a PNG, JPG, or WebP image')
      return
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      setError('File size must be less than 1MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = supabaseBrowser()

      // Optimistic preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // Generate filename
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/logo.${fileExt}`

      // Delete old files if they exist
      try {
        const { data: existingFiles } = await supabase.storage
          .from('reseller-logos')
          .list(userId)

        if (existingFiles && existingFiles.length > 0) {
          const filesToRemove = existingFiles.map(f => `${userId}/${f.name}`)
          const { error: removeError } = await supabase.storage
            .from('reseller-logos')
            .remove(filesToRemove)
          
          if (removeError) {
            console.warn('Failed to remove old logos:', removeError)
          }
        }
      } catch (listError) {
        console.warn('Failed to list existing logos:', listError)
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('reseller-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL with cache busting
      const timestamp = Date.now()
      const { data: { publicUrl } } = supabase.storage
        .from('reseller-logos')
        .getPublicUrl(filePath)
      
      const urlWithCacheBust = `${publicUrl}?t=${timestamp}`

      // Update database via admin API
      const res = await fetch('/admin/api/resellers/update-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reseller_id: resellerId,
          logo_url: urlWithCacheBust 
        })
      })

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update logo')
      }

      // Cleanup and refresh
      URL.revokeObjectURL(objectUrl)
      router.refresh()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = preview || currentUrl

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group"
        aria-label="Change logo"
      >
        {/* Avatar Circle */}
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-200">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={shopName}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-2xl font-bold text-slate-600">
              {getInitials(shopName)}
            </span>
          )}
        </div>

        {/* Hover Overlay */}
        {!uploading && (
          <div className="absolute inset-0 rounded-lg bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Upload Spinner */}
        {uploading && (
          <div className="absolute inset-0 rounded-lg bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </button>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg z-10">
          <p className="text-xs text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 hover:text-red-800 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
