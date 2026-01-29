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

    useEffect(() => {
        if (!currentOrg) return

        setIsLoading(true)
        const postsRef = collection(db, "organizations", currentOrg.id, "posts")

        // Base constraints
        const constraints: QueryConstraint[] = [
            orderBy("createdAt", "desc"),
            limit(variant === 'widget' ? 8 : 20)
        ]

        if (filterByUser && currentUser) {
            // Note: Requires compound index (author.id + createdAt)
            // If index missing, might fail. 
            // For safety without advanced index deployment right now, fetch all then filter client key if small?
            // Or just try query constraints. Firestore usually prompts for index creation.
            // Let's rely on client side filtering for now if dataset is small to avoid blocking deployment,
            // OR use the query and assume we can click the link to create index.
            // Ideally: constraints.unshift(where("author.id", "==", currentUser.uid))
            // But orderBy createdAt requires index.

            // Let's use client side filtering for simple prototype to guarantee it works instantly
            // Real app should index.
        }

        const q = query(postsRef, ...constraints)

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                orgId: currentOrg.id
            })) as Post[]

            if (filterByUser && currentUser) {
                setPosts(fetchedPosts.filter(p => p.author.id === currentUser.id))
            } else {
                setPosts(fetchedPosts)
            }
            setIsLoading(false)
        }, (err) => {
            console.error("Error fetching wall posts:", err)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentOrg, variant, filterByUser, currentUser])

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
