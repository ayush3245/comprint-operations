import { notFound } from 'next/navigation'

// Purchase Order detail pages are disabled - POs come from external system
export default async function PurchaseOrderDetailPage() {
    notFound()
}
