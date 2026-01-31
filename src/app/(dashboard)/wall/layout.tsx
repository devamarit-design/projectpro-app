import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Team Wall | HipslothProject",
    description: "อัปเดตความเคลื่อนไหวและแชร์ผลงานในทีมของคุณ",
};

export default function WallLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
