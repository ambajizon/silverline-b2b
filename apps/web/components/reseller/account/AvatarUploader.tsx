'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Upload } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { updateLogoUrl } from '@/app/(reseller)/reseller/account/actions'

interface AvatarUploaderProps {
  currentUrl: string | null
  shopName: string
}

export default function AvatarUploader({ currentUrl, shopName }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG or JPG)')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const supabase = supabaseBrowser()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = fileName

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('reseller-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      setProgress(50)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('reseller-logos')
        .getPublicUrl(filePath)

      setProgress(75)

      // Update database
      const result = await updateLogoUrl(publicUrl)

      if (!result.success) {
        throw new Error(result.error ?? 'Failed to update logo')
      }

      setProgress(100)

      // Refresh page to show new logo
      window.location.reload()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group"
      >
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={shopName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-blue-600">
              {getInitials(shopName)}
            </span>
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="text-white text-xs font-medium">
              {progress}%
            </div>
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Upload indicator */}
        {uploading && (
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-red-50 border border-red-200 rounded-lg p-2 z-10">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
