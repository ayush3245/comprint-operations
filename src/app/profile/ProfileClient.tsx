'use client'

import { useState, useTransition, useRef } from 'react'
import { updateUserProfile } from '@/lib/actions'
import { User, Mail, Phone, Shield, Calendar, Camera, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Profile = {
    id: string
    name: string
    email: string
    phone: string | null
    profilePicture: string | null
    role: string
    createdAt: Date
}

interface ProfileClientProps {
    profile: Profile
}

export default function ProfileClient({ profile }: ProfileClientProps) {
    const [isPending, startTransition] = useTransition()
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(profile.name)
    const [phone, setPhone] = useState(profile.phone || '')
    const [profilePicture, setProfilePicture] = useState(profile.profilePicture || '')
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image must be less than 2MB' })
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePicture(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateUserProfile({
                    name: name.trim(),
                    phone: phone.trim() || undefined,
                    profilePicture: profilePicture || undefined
                })
                setMessage({ type: 'success', text: 'Profile updated successfully' })
                setIsEditing(false)
                setTimeout(() => setMessage(null), 3000)
            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to update profile' })
            }
        })
    }

    const handleCancel = () => {
        setName(profile.name)
        setPhone(profile.phone || '')
        setProfilePicture(profile.profilePicture || '')
        setIsEditing(false)
        setMessage(null)
    }

    const formatRole = (role: string) => {
        return role.split('_').map(word =>
            word.charAt(0) + word.slice(1).toLowerCase()
        ).join(' ')
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">My Profile</h1>
                <p className="text-sm text-muted-foreground mt-1">View and manage your account details</p>
            </div>

            {message && (
                <div className={cn(
                    'mb-4 p-3 rounded-lg flex items-center gap-2 text-sm',
                    message.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                )}>
                    {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {message.text}
                </div>
            )}

            <div className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative">
                            {profilePicture ? (
                                <img
                                    src={profilePicture}
                                    alt={name}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20"
                                />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-4 border-white/20">
                                    {getInitials(name)}
                                </div>
                            )}
                            {isEditing && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                                >
                                    <Camera size={16} className="text-gray-700" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl sm:text-2xl font-bold text-white">{profile.name}</h2>
                            <p className="text-white/80 text-sm">{formatRole(profile.role)}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="p-6 space-y-6">
                    {/* Name Field */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                            <User size={18} />
                            <span className="text-sm font-medium">Name</span>
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Your name"
                            />
                        ) : (
                            <span className="text-foreground">{profile.name}</span>
                        )}
                    </div>

                    {/* Email Field (read-only) */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                            <Mail size={18} />
                            <span className="text-sm font-medium">Email</span>
                        </div>
                        <span className="text-foreground">{profile.email}</span>
                    </div>

                    {/* Phone Field */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                            <Phone size={18} />
                            <span className="text-sm font-medium">Phone</span>
                        </div>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Your phone number"
                            />
                        ) : (
                            <span className={profile.phone ? 'text-foreground' : 'text-muted-foreground'}>
                                {profile.phone || 'Not set'}
                            </span>
                        )}
                    </div>

                    {/* Role Field (read-only) */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                            <Shield size={18} />
                            <span className="text-sm font-medium">Role</span>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            {formatRole(profile.role)}
                        </span>
                    </div>

                    {/* Member Since (read-only) */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                            <Calendar size={18} />
                            <span className="text-sm font-medium">Member Since</span>
                        </div>
                        <span className="text-foreground">{formatDate(profile.createdAt)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-muted border-t border-default flex flex-col sm:flex-row gap-3 sm:justify-end">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-input rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isPending || !name.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending && <Loader2 size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-500 hover:to-violet-500 transition-all"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
