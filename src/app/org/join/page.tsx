"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/context/organization-context" // We will need to add join function here
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ArrowLeft, Loader2 } from "lucide-react"

export default function JoinOrganizationPage() {
    const [inviteCode, setInviteCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const { joinOrganization } = useOrganization()


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteCode.trim()) return

        setIsLoading(true)
        setError("")

        try {
            // Mock implementation until Context is updated
            console.log("Joining org with code:", inviteCode)
            // await joinOrganization(inviteCode)

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // For now, show error because logic isn't there
            setError("Join functionality is coming soon! Please ask an admin to invite you via email.")

        } catch (err) {
            setError("Invalid invite code or unable to join.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md border-none shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-secondary/20 p-3 rounded-full w-fit mb-2">
                        <Users className="w-8 h-8 text-secondary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Join Organization</CardTitle>
                    <CardDescription>
                        Enter the invite code shared with you by your organization admin.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="inviteCode">Invite Code</Label>
                            <Input
                                id="inviteCode"
                                placeholder="Paste invite code here"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            disabled={isLoading || !inviteCode.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                "Join Organization"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => router.back()}
                            type="button"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Create
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
