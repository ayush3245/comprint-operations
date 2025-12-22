import { notFound } from 'next/navigation'

// Purchase Order pages are disabled - POs come from external system
export default async function PurchaseOrdersPage() {
    notFound()
}
