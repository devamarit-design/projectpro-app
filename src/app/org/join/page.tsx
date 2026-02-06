"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useOrganization } from "@/context/organization-context"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ArrowLeft, Loader2, CheckCircle2, Building2, LogIn, ScanLine, X } from "lucide-react"
import { Suspense, useEffect, useState } from "react"
import { useZxing } from "react-zxing"
import { Dialog, DialogContent } from "@/components/ui/dialog"

function JoinContent() {
    const searchParams = useSearchParams()
    const autoCode = searchParams.get("code")
    const { t } = useTranslation()
    const { currentUser, login } = useProjects()
    const { joinOrganizationByCode, getOrganizationPreview } = useOrganization()
    const router = useRouter()

    const [inviteCode, setInviteCode] = useState(autoCode || "")
    const [isLoading, setIsLoading] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState("")
    const [orgPreview, setOrgPreview] = useState<{ id: string, name: string, memberCount: number } | null>(null)
    const [isScanning, setIsScanning] = useState(false)

    const { ref } = useZxing({
        onDecodeResult(result) {
            const text = result.getText()
            if (text) {
                // Try to extract code from URL if present
                try {
                    const url = new URL(text)
                    const codeParam = url.searchParams.get("code")
                    if (codeParam) {
                        setInviteCode(codeParam)
                        handleFetchPreview(codeParam)
                        setIsScanning(false)
                        return
                    }
                } catch (e) {
                    // Not a URL, treat as code
                }

                setInviteCode(text)
                handleFetchPreview(text)
                setIsScanning(false)
            }
        },
        paused: !isScanning
    });

    const handleFetchPreview = async (code: string) => {
        if (!code.trim()) return
        setIsLoading(true)
        setError("")
        try {
            const preview = await getOrganizationPreview(code)
            if (preview) {
                setOrgPreview(preview)
                setIsPreviewing(true)
            } else {
                setError("Organization not found")
                setIsPreviewing(false)
            }
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Invalid invite code")
            setIsPreviewing(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoin = async () => {
        if (!inviteCode.trim() || !currentUser) return

        setIsLoading(true)
        setError("")

        try {
            await joinOrganizationByCode(inviteCode)
            setIsSuccess(true)
            setTimeout(() => {
                router.push("/")
            }, 1500)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Unable to join.")
            setIsLoading(false)
        }
    }

    const handleSubmitCode = async (e: React.FormEvent) => {
        e.preventDefault()
        handleFetchPreview(inviteCode.trim())
    }

    // Auto-fetch preview if code is in URL
    useEffect(() => {
        if (autoCode && !isSuccess && !isPreviewing && !isLoading) {
            handleFetchPreview(autoCode)
        }
    }, [autoCode])

    if (isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md border-none shadow-xl text-center p-8 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t.dialogs.join_org.success_title}</CardTitle>
                    <p className="text-muted-foreground">{t.dialogs.join_org.success_msg}</p>
                </Card>
            </div>
        )
    }

    if (isPreviewing && orgPreview) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md border-none shadow-xl overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div className="bg-background p-4 rounded-2xl shadow-lg -mb-12">
                            <Building2 className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <CardHeader className="pt-16 text-center space-y-2">
                        <CardDescription className="uppercase tracking-widest text-xs font-bold text-primary">
                            {t.dialogs.join_org.preview_title}
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">{orgPreview.name}</CardTitle>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground bg-muted/50 w-fit mx-auto px-3 py-1 rounded-full text-sm">
                            <Users className="w-4 h-4" />
                            {t.dialogs.join_org.members_count.replace('{count}', orgPreview.memberCount.toString())}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {!currentUser && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center space-y-3">
                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                    {t.dialogs.join_org.sign_in_required}
                                </p>
                                <Button onClick={() => login('google')} className="w-full gap-2 bg-yellow-600 hover:bg-yellow-700">
                                    <LogIn className="w-4 h-4" />
                                    Login with Google
                                </Button>
                            </div>
                        )}
                        {error && (
                            <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pb-8">
                        {currentUser && (
                            <Button
                                onClick={handleJoin}
                                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {t.dialogs.join_org.joining}
                                    </>
                                ) : (
                                    t.dialogs.join_org.join_btn
                                )}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => {
                                setIsPreviewing(false)
                                setOrgPreview(null)
                                if (!autoCode) setInviteCode("")
                            }}
                            disabled={isLoading}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t.dialogs.join_org.back_to_create}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md border-none shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t.dialogs.join_org.title}</CardTitle>
                    <CardDescription>
                        {t.dialogs.join_org.subtitle}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitCode}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="inviteCode">{t.dialogs.join_org.invite_code}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="inviteCode"
                                    placeholder={t.dialogs.join_org.placeholder}
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="h-12 text-lg text-center tracking-wider"
                                    required
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    className="h-12 w-12 px-0 shrink-0"
                                    variant="outline"
                                    onClick={() => setIsScanning(true)}
                                >
                                    <ScanLine className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        {error && (
                            <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-8">
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                            disabled={isLoading || !inviteCode.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t.common.loading}...
                                </>
                            ) : (
                                "Next"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => router.push("/")}
                            type="button"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t.dialogs.join_org.back_to_create}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Dialog open={isScanning} onOpenChange={setIsScanning}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none">
                    <div className="relative w-full aspect-square bg-black">
                        {/* Close button */}
                        <button
                            onClick={() => setIsScanning(false)}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <video ref={ref} className="w-full h-full object-cover" />

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 border-2 border-white/20 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                <div className="absolute inset-0 animate-pulse bg-primary/10"></div>
                            </div>
                        </div>
                        <p className="absolute bottom-8 left-0 right-0 text-center text-white font-medium drop-shadow-md">
                            Scan organization QR code
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function JoinOrganizationPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <JoinContent />
        </Suspense>
    )
}
