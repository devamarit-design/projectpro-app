import { Metadata } from "next";

export const metadata: Metadata = {
    title: "ลงทะเบียน | HipslothProject",
    description: "เริ่มต้นจัดการโครงการก่อสร้างของคุณอย่างมืออาชีพด้วย HipslothProject",
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
