import { Metadata } from "next";

export const metadata: Metadata = {
    title: "ลืมรหัสผ่าน | HipslothProject",
    description: "กู้คืนรหัสผ่านเพื่อเข้าใช้งานบัญชี HipslothProject ของคุณ",
};

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
