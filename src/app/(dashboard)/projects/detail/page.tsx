import { Suspense } from "react"
import ProjectDetailClient from "./project-detail-client"

export default async function ProjectDetailPage({
    searchParams,
}: {
    searchParams: Promise<{ id: string }>
}) {
    const { id } = await searchParams

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProjectDetailClient />
        </Suspense>
    )
}
