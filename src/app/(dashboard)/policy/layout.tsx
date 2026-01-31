import { Metadata } from "next";

export const metadata: Metadata = {
    title: "นโยบายการใช้งาน | HipslothProject",
    description: "ข้อกำหนดและเงื่อนไขการใช้งานแอปพลิเคชัน HipslothProject",
};

export default function PolicyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
