"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/context/organization-context"
import { collection, query, orderBy, limit, onSnapshot, where, QueryConstraint } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Post, PostCard } from "./post-card"
import { CreatePost } from "./create-post"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjects } from "@/context/project-context"

interface WallFeedProps {
    variant?: 'full' | 'widget'
    filterByUser?: boolean // If true, show only current user's posts
}

export function WallFeed({ variant = 'full', filterByUser = false }: WallFeedProps) {
    const { currentOrg } = useOrganization()
    const { currentUser } = useProjects()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const currentOrgId = currentOrg?.id
    const currentUserId = currentUser?.id

    useEffect(() => {
        if (!currentOrgId) return

        // Only show loading if we don't have posts for this org yet or org changed
        setIsLoading(prev => posts.length === 0 || prev)

        const postsRef = collection(db, "organizations", currentOrgId, "posts")

        // Base constraints
        const constraints: QueryConstraint[] = [
            orderBy("createdAt", "desc"),
            limit(variant === 'widget' ? 8 : 20)
        ]

        const q = query(postsRef, ...constraints)

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                orgId: currentOrgId
            })) as Post[]

            if (filterByUser && currentUserId) {
                setPosts(fetchedPosts.filter(p => p.author.id === currentUserId))
            } else {
                setPosts(fetchedPosts)
            }
            setIsLoading(false)
        }, (err) => {
            console.error("Error fetching wall posts:", err)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentOrgId, variant, filterByUser, currentUserId])

    if (isLoading) {
        return (
            <div className="space-y-4">
                {variant === 'full' && <Skeleton className="h-[140px] w-full rounded-xl" />}
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
        )
    }

    return (
        <div className={variant === 'full' ? "space-y-6 max-w-2xl mx-auto w-full" : "w-full"}>
            {variant === 'full' && !filterByUser && <CreatePost />}

            <div className={variant === 'widget'
                ? "flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x scrollbar-hide"
                : "space-y-4"
            }>
                {posts.length === 0 ? (
                    <div className={variant === 'widget' ? "w-full text-center py-8 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50" : "text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border"}>
                        <p className={variant === 'widget' ? "text-sm" : "text-muted-foreground"}>No posts yet. Be the first to share!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className={variant === 'widget' ? "min-w-[320px] max-w-[320px] snap-center" : "w-full"}>
                            <PostCard post={post} />
                        </div>
                    ))
                )}
                {variant === 'widget' && posts.length > 0 && (
                    <div className="min-w-[150px] max-w-[150px] snap-center flex items-center justify-center">
                        <a href="/wall" className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-primary">
                            <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </div>
                            <span className="text-sm font-medium">ดูเพิ่มเติม</span>
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
