import Link from 'next/link'
import { ShoppingCart, Package, User, Headphones, Wallet } from 'lucide-react'

const links = [
  {
    key: 'catalog',
    title: 'View Catalog',
    href: '/reseller/products',
    icon: Package,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    key: 'account',
    title: 'My Account',
    href: '/reseller/account',
    icon: User,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    key: 'payments',
    title: 'Payments',
    href: '/reseller/payments',
    icon: Wallet,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    key: 'support',
    title: 'Support',
    href: '/reseller/support',
    icon: Headphones,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
]

export default function QuickLinksGrid() {
  // Deduplicate links by href to prevent accidental duplicates
  const deduped = Array.from(new Map(links.map(l => [l.href, l])).values())

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h2>

      <div className="grid grid-cols-2 gap-3">
        {deduped.map((link, i) => {
          const Icon = link.icon
          return (
            <Link
              key={link.key ?? `${link.href}-${i}`}
              href={link.href}
              className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className={`${link.bg} p-3 rounded-full mb-2`}>
                <Icon className={`h-6 w-6 ${link.color}`} />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">
                {link.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
