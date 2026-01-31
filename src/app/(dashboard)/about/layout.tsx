import { Metadata } from "next";

export const metadata: Metadata = {
    title: "เกี่ยวกับเรา | HipslothProject",
    description: "ทำความรู้จักกับ HipslothProject แอปพลิเคชันที่ช่วยให้งานก่อสร้างของคุณง่ายขึ้น",
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
