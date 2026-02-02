"use client"

import { useEffect, useState, useMemo } from "react"
import { useOrganization } from "@/context/organization-context"
import { collection, query, orderBy, limit, onSnapshot, where, QueryConstraint } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Post, PostCard } from "./post-card"
import { CreatePost } from "./create-post"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjects } from "@/context/project-context"
import { get, set } from "idb-keyval"
import { Hash, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface WallFeedProps {
    variant?: 'full' | 'widget'
    filterByUser?: boolean // If true, show only current user's posts
}

export function WallFeed({ variant = 'full', filterByUser = false }: WallFeedProps) {
    const { currentOrg } = useOrganization()
    const { currentUser } = useProjects()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    const currentOrgId = currentOrg?.id
    const currentUserId = currentUser?.id

    // Unified Hashtag Regex (Thai support)
    const hashtagRegex = /#[\wก-๙]+/g

    useEffect(() => {
        if (!currentOrgId) return

        const CACHE_KEY = `wall_posts_${currentOrgId}_${variant}_${filterByUser ? currentUserId : 'all'}`

        // 1. Load from Cache immediately
        const loadFromCache = async () => {
            // Only show loading if we really have nothing
            setIsLoading(prev => posts.length === 0 ? true : prev)

            try {
                const cachedPosts = await get(CACHE_KEY)
                if (cachedPosts && Array.isArray(cachedPosts) && cachedPosts.length > 0) {
                    setPosts(cachedPosts)
                    setIsLoading(false) // Show cached content immediately
                }
            } catch (err) {
                console.warn("Failed to load wall cache:", err)
            }
        }

        loadFromCache()

        const postsRef = collection(db, "organizations", currentOrgId, "posts")

        // Base constraints
        const constraints: QueryConstraint[] = [
            orderBy("createdAt", "desc"),
            limit(variant === 'widget' ? 8 : 50) // Increased limit for better filtering context
        ]

        const q = query(postsRef, ...constraints)

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                orgId: currentOrgId
            })) as Post[]

            let finalPosts = fetchedPosts
            if (filterByUser && currentUserId) {
                finalPosts = fetchedPosts.filter(p => p.author.id === currentUserId)
            }

            setPosts(finalPosts)
            setIsLoading(false)

            // Update Cache
            set(CACHE_KEY, finalPosts).catch(err => console.warn("Failed to update wall cache:", err))

        }, (err) => {
            console.error("Error fetching wall posts:", err)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentOrgId, variant, filterByUser, currentUserId])

    // Extract Unique Hashtags
    const availableHashtags = useMemo(() => {
        const tags = new Set<string>()
        const sourcePosts = posts // Compute from all fetched posts

        sourcePosts.forEach(post => {
            if (!post.content) return
            const matches = post.content.match(hashtagRegex)
            if (matches) {
                matches.forEach(tag => tags.add(tag))
            }
        })

        // Sort tags alphabetically
        return Array.from(tags).sort((a, b) => a.localeCompare(b, 'th'))
    }, [posts])

    // Filter Logic
    const filteredPosts = useMemo(() => {
        if (!selectedTag) return posts
        return posts.filter(post =>
            post.content && post.content.match(hashtagRegex)?.includes(selectedTag)
        )
    }, [posts, selectedTag])

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
            {variant === 'full' && !filterByUser && (
                <>
                    <CreatePost />

                    {/* Hashtag Filter Bar */}
                    {availableHashtags.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none mask-fade">
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border shrink-0",
                                    !selectedTag
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Hash className="w-3 h-3" />
                                All Posts
                            </button>

                            {availableHashtags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border shrink-0",
                                        selectedTag === tag
                                            ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-blue-500/10 hover:text-blue-500"
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            <div className={variant === 'widget'
                ? "flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x scrollbar-hide"
                : "space-y-4" // Use filtered list for main feed
            }>
                {filteredPosts.length === 0 ? (
                    <div className={variant === 'widget' ? "w-full text-center py-8 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50" : "text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3"}>
                        {selectedTag ? (
                            <>
                                <Hash className="w-10 h-10 opacity-20" />
                                <p className="text-muted-foreground">No posts found with <span className="text-primary font-bold">{selectedTag}</span></p>
                                <button onClick={() => setSelectedTag(null)} className="text-xs text-blue-500 hover:underline">Clear filter</button>
                            </>
                        ) : (
                            <p className={variant === 'widget' ? "text-sm" : "text-muted-foreground"}>No posts yet. Be the first to share!</p>
                        )}
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <div key={post.id} className={variant === 'widget' ? "min-w-[320px] max-w-[320px] snap-center" : "w-full animate-in fade-in slide-in-from-bottom-4 duration-500"}>
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
