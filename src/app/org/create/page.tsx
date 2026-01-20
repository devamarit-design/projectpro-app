"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/context/organization-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, Loader2 } from "lucide-react"

export default function CreateOrganizationPage() {
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { createOrganization } = useOrganization()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            await createOrganization(name)
            router.push("/") // Go to dashboard after creation
        } catch (error) {
            console.error("Failed to create organization", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md border-none shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to HipslothProject</CardTitle>
                    <CardDescription>
                        To get started, please create your first organization.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="orgName">Organization Name</Label>
                            <Input
                                id="orgName"
                                placeholder="e.g. Acme Construction Co."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                minLength={3}
                                required
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                This will be the name of your workspace. You can change it later.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Workspace...
                                </>
                            ) : (
                                "Create Organization"
                            )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </CardFooter>
                </form>
                <div className="p-6 pt-0 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => router.push("/org/join")}
                    >
                        Join an existing Organization
                    </Button>
                </div>
            </Card>

        </div>
    )
}
