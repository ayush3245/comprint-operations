import { notFound } from 'next/navigation'

// Purchase Order creation is disabled - POs come from external system
export default async function NewPurchaseOrderPage() {
    notFound()
}
