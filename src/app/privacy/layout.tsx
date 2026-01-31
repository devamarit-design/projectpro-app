import { Metadata } from "next";

export const metadata: Metadata = {
    title: "นโยบายความเป็นส่วนตัว | HipslothProject",
    description: "เรียนรู้เกี่ยวกับวิธีการที่เราดูแลรักษาและปกป้องข้อมูลโครงการของคุณ",
};

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
