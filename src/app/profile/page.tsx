import { getUserProfile } from '@/lib/actions'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
    const profile = await getUserProfile()

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Unable to load profile</p>
            </div>
        )
    }

    return <ProfileClient profile={profile} />
}
