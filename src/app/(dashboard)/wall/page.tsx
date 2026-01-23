"use client"

import { WallFeed } from "@/components/wall/wall-feed"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/lib/i18n-context"
import { LayoutGrid, User } from "lucide-react"

export default function WallPage() {
    const { t } = useTranslation()

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent w-fit">
                    Team Wall
                </h1>
                <p className="text-muted-foreground">
                    Share updates, photos, and moments with your team.
                </p>
            </div>

            <Tabs defaultValue="feed" className="w-full">
                <TabsList className="bg-muted/50 p-1 mb-6">
                    <TabsTrigger value="feed" className="gap-2 data-[state=active]:bg-background">
                        <LayoutGrid className="h-4 w-4" />
                        Community Feed
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="gap-2 data-[state=active]:bg-background">
                        <User className="h-4 w-4" />
                        My Posts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="feed" className="m-0">
                    <WallFeed variant="full" />
                </TabsContent>

                <TabsContent value="personal" className="m-0">
                    <WallFeed variant="full" filterByUser={true} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
