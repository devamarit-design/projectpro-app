import { Suspense } from "react"
import EditProjectClient from "./edit-project-client"

export default function EditProjectPage({
    searchParams,
}: {
    searchParams: { id: string }
}) {
    const { id } = searchParams

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditProjectClient />
        </Suspense>
    )
}
