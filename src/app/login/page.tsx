import { prisma } from '@/lib/db'
import { login } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })

    async function handleLogin(formData: FormData) {
        'use server'
        const userId = formData.get('userId') as string
        if (userId) {
            await login(userId)
            redirect('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Comprint Operations</h1>
                <p className="text-gray-600 mb-6 text-center">Select a user to login (Dev Mode)</p>

                <form action={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                            Select User
                        </label>
                        <select
                            name="userId"
                            id="userId"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">-- Select User --</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    )
}
