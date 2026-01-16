import { Suspense } from "react"
import ProjectDetailClient from "./project-detail-client"

export default function ProjectDetailPage({
    searchParams,
}: {
    searchParams: { id: string }
}) {
    const { id } = searchParams

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProjectDetailClient />
        </Suspense>
    )
}
