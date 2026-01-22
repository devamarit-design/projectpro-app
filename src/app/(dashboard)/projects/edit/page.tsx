import { Suspense } from "react"
import EditProjectClient from "./edit-project-client"

export default async function EditProjectPage({
    searchParams,
}: {
    searchParams: Promise<{ id: string }>
}) {
    const { id } = await searchParams

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditProjectClient />
        </Suspense>
    )
}
