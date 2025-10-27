import Image from 'next/image'

interface DashboardHeaderProps {
  name?: string
  humanCode?: string
  logoUrl?: string | null
  shopName?: string
}

export default function DashboardHeader({ name, humanCode, logoUrl, shopName }: DashboardHeaderProps) {
  const getInitials = (text: string) => {
    if (!text) return 'R'
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3">
        {/* Logo/Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={shopName || name || 'Logo'}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-lg font-bold text-blue-600">
              {getInitials(shopName || name || 'R')}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-slate-900">
            Welcome back, {name || 'Reseller'}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Reseller ID: {humanCode || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
