'use client'

import { useTransition } from 'react'
import { saveShippingAddress } from '@/app/(reseller)/reseller/checkout/actions'
import { toast } from 'sonner'

interface SaveAddressButtonProps {
  shipping: {
    full_name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
}

export default function SaveAddressButton({ shipping }: SaveAddressButtonProps) {
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => {
        try {
          await saveShippingAddress(shipping)
          toast.success('Shipping address saved')
        } catch (e: any) {
          toast.error(e.message ?? 'Failed to save address')
        }
      })}
      className="px-3 py-2 text-sm font-medium rounded-md border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Saving…' : 'Save address'}
    </button>
  )
}
