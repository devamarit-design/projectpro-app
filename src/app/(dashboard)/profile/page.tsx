"use client"

import * as React from "react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { createPortal } from "react-dom"
import { auth, storage } from "@/lib/firebase"
import { Mail, Phone, Shield, User as UserIcon, Save, X, Camera, LogOut, Check, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/image-utils"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export default function ProfilePage() {
    const { currentUser, updateUser, setCurrentUser, currentTeam } = useProjects()
    const { t } = useTranslation()

    const [isEditing, setIsEditing] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: "",
        phone: "",
        email: ""
    })
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const [uploading, setUploading] = React.useState(false)

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentUser) return

        try {
            setUploading(true)

            // 1. Compress Image
            const compressedBlob = await compressImage(file)

            // 2. Upload to Firebase Storage
            const storageRef = ref(storage, `profile_pictures/${currentUser.id}/${Date.now()}.jpg`)
            await uploadBytes(storageRef, compressedBlob)

            // 3. Get Download URL
            const downloadURL = await getDownloadURL(storageRef)

            // 4. Update Firestore
            await updateUser(currentUser.id, { avatar: downloadURL })

        } catch (error) {
            console.error("Failed to upload profile picture", error)
            alert("Failed to upload image. Please try again.")
        } finally {
            setUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    React.useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name,
                phone: currentUser.phone || "",
                email: currentUser.email || ""
            })
        }
    }, [currentUser])

    const handleSave = () => {
        if (!currentUser) return

        updateUser(currentUser.id, {
            name: formData.name,
            phone: formData.phone,
            email: formData.email
        })
        setIsEditing(false)
    }

    const handleCancel = () => {
        if (currentUser) {
            setFormData({
                name: currentUser.name,
                phone: currentUser.phone || "",
                email: currentUser.email || ""
            })
        }
        setIsEditing(false)
    }

    if (!currentUser) return null

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t.common.profile}</h1>
                    <p className="text-muted-foreground">{t.common.personal_info}</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium shadow-lg hover:translate-y-0.5 transition-all"
                    >
                        {t.common.edit_profile}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="bg-muted text-muted-foreground px-4 py-2 rounded-xl font-medium hover:bg-muted/80 transition-all"
                        >
                            {t.common.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium shadow-lg hover:translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {t.common.save}
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Card */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-purple-500/10" />

                {/* Avatar Section */}
                <div className="relative flex flex-col items-center">
                    <div
                        onClick={handleAvatarClick}
                        className="w-32 h-32 rounded-3xl bg-background shadow-2xl flex items-center justify-center text-4xl font-bold text-primary border-4 border-card relative group cursor-pointer overflow-hidden"
                    >
                        {/* Placeholder Avatar */}
                        {!currentUser.avatar ? (
                            currentUser.name.charAt(0).toUpperCase()
                        ) : (
                            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                        )}

                        {/* Hover Overlay & Loading State */}
                        <div className={cn(
                            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                            uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            ) : (
                                <Camera className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div className="mt-4 text-center">
                        <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2 border",
                            currentTeam?.role === 'Owner' || currentTeam?.role === 'Admin'
                                ? "bg-purple-500/10 text-purple-600 border-purple-200"
                                : "bg-blue-500/10 text-blue-600 border-blue-200"
                        )}>
                            <Shield className="w-3 h-3" />
                            {currentTeam?.role || 'Member'}
                        </div>

                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            {t.profile.fields.name}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-xl font-medium">
                                {currentUser.name}
                            </div>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {t.profile.fields.email}
                        </label>
                        {isEditing ? (
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-xl font-medium">
                                {currentUser.email || "-"}
                            </div>
                        )}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {t.profile.fields.phone}
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-xl font-medium font-mono">
                                {currentUser.phone || "-"}
                            </div>
                        )}
                    </div>

                    {/* Role Field (Read Only) */}
                    <div className="space-y-2 opacity-70">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            {t.profile.fields.role}
                        </label>
                        <div className="p-3 bg-muted/30 rounded-xl font-medium">
                            {currentTeam?.role || 'Member'}
                        </div>
                    </div>
                </div>

                {/* Log Out Button */}
                <LogoutButton />
            </div>

            {/* Security Section */}
            <SecuritySection />

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-red-600">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Danger Zone</h2>
                </div>
                <div className="h-px bg-red-500/10" />

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-red-900">Delete Account</h3>
                        <p className="text-sm text-red-700/70">Permanently delete your account and all data.</p>
                    </div>
                    <DeleteAccountButton />
                </div>
            </div>
        </div >
    )
}

function LogoutButton() {
    const { logout } = useProjects()
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = React.useState(false)

    const handleLogout = async () => {
        try {
            await logout()
            window.location.href = "/login"
        } catch (error) {
            console.error("Logout failed", error)
            alert("Failed to log out")
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(true)
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-xl font-bold transition-all"
            >
                <LogOut className="w-5 h-5" />
                {t.common.log_out}
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95 text-left">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                            <LogOut className="w-6 h-6 ml-1" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">{t.common.log_out}?</h3>
                            <p className="text-gray-500 text-sm">
                                {t.common.confirm_logout}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                {t.common.log_out}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

function DeleteAccountButton() {
    const { deleteAccount } = useProjects()
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [password, setPassword] = React.useState("")
    const [error, setError] = React.useState("")

    // Check if user needs password confirmation (Password Provider)
    const isPasswordUser = auth.currentUser?.providerData.some(p => p.providerId === 'password')

    const handleDelete = async () => {
        setError("")
        if (isPasswordUser && !password) {
            setError("Password is required to confirm deletion.")
            return
        }

        setIsDeleting(true)
        try {
            await deleteAccount(password)
        } catch (error: any) {
            console.error(error)
            const msg = error.message || "Failed to delete account."
            setError(msg)
            alert(msg)
            setIsDeleting(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(true)
                    setPassword("")
                    setError("")
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
            >
                Delete Account
            </button>



            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in text-left">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Delete Account?</h3>
                            <p className="text-gray-500 text-sm">
                                This action cannot be undone. All your data will be permanently removed.
                            </p>
                        </div>

                        {/* Password Prompt for Email Users */}
                        {isPasswordUser && (
                            <div className="space-y-2">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password to confirm"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 text-left">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting || (isPasswordUser && !password)}
                                className="px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )
            }
        </>
    )
}

function SecuritySection() {
    const { updateUserPassword } = useProjects()
    const { t } = useTranslation()
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleUpdatePassword = async () => {
        if (!password) return
        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: "Passwords do not match" })
            return
        }
        if (password.length < 6) {
            setStatus({ type: 'error', message: "Password must be at least 6 characters" })
            return
        }

        setIsLoading(true)
        setStatus(null)

        try {
            await updateUserPassword(password)
            setStatus({ type: 'success', message: "Password updated successfully" })
            setPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                setStatus({ type: 'error', message: "Please log out and log in again to change your password." })
            } else {
                setStatus({ type: 'error', message: "Failed to update password. Please try again." })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-primary">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Security</h2>
            </div>
            <div className="h-px bg-border/50" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{t.auth?.new_password || "New Password"}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{t.auth?.confirm_password || "Confirm Password"}</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {status && (
                <div className={cn(
                    "p-3 rounded-xl text-sm font-medium flex items-center gap-2",
                    status.type === 'success' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                    {status.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {status.message}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleUpdatePassword}
                    disabled={!password || isLoading}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? "Updating..." : "Update Password"}
                </button>
            </div>
        </div>
    )
}
