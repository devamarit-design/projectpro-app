import { Loading } from "@/components/ui/loading";

export default function LoadingPage() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[9999]">
            <Loading />
        </div>
    );
}
