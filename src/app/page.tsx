import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const user = await getCurrentUser()

  if (user) {
    // Redirect superadmin to user management as home page
    if (user.role === 'SUPERADMIN') {
      redirect('/admin/users')
    } else {
      redirect('/dashboard')
    }
  } else {
    redirect('/login')
  }
}
