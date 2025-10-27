import { notFound } from 'next/navigation'
import { getProduct, getCurrentSilverRate } from '../actions'
import ProductDetail from '@/components/reseller/ProductDetail'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const [product, silverRate] = await Promise.all([
    getProduct(id),
    getCurrentSilverRate(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-4">
      <ProductDetail product={product} silverRate={silverRate} />
    </div>
  )
}
