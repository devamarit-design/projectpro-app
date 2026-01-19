import { Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-lg font-medium">Waiting...</p>
        </div>
    );
}
