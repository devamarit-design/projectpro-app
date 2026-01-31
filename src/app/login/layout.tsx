import { Metadata } from "next";

export const metadata: Metadata = {
    title: "เข้าสู่ระบบ | HipslothProject",
    description: "เข้าสู่ระบบเพื่อจัดการโครงการก่อสร้างและค่าใช้จ่ายของคุณ",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
