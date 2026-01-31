---
name: hipsloth
description: Project-specific skills for the Hipsloth application (Next.js, Firebase, Tauri).
---

# Hipsloth Project Skill (ภาษาไทย)

สกิลนี้ให้ข้อมูลบริบทและคำแนะนำสำหรับการทำงานในโปรเจค Hipsloth ซึ่งเป็นแอปพลิเคชันจัดการงานและโปรเจคสมัยใหม่ที่สร้างด้วย Next.js, Firebase และ Tauri

## Communication (ภาษา)

- **Language Instruction**: เมื่อทำงานกับผู้ใช้ในโปรเจคนี้ ให้โต้ตอบและอธิบายโค้ดหรือการเปลี่ยนแปลงต่างๆ **เป็นภาษาไทย** เป็นหลัก (Interact and explain code or changes in **Thai** by default).

## Project Architecture (โครงสร้างสถาปัตยกรรม)

- **Frontend**: Next.js 16 (App Router), React 19.
- **Styling**: Tailwind CSS v4.
- **UI Components**: Radix UI, Framer Motion, Lucide React.
- **Backend/Database**: Firebase (Firestore, Auth, Storage, Cloud Functions).
- **Desktop**: Tauri (for cross-platform desktop support).
- **Localization**: Custom i18n system in `src/lib/dictionaries`.

## Key Directories (โฟลเดอร์สำคัญ)

- `/src/app`: หน้าเว็บ (Pages) และ Layouts ต่างๆ ของ Next.js App Router
- `/src/components`: UI components ที่จัดหมวดหมู่ตามฟีเจอร์ (เช่น `dashboard`, `tasks`, `ui`)
- `/src/lib`: ตรรกะหลัก (Core logic), Utilities และการตั้งค่า Firebase
- `/functions`: Firebase Cloud Functions สำหรับ Logic ฝั่ง Server-side
- `/src-tauri`: การตั้งค่าและโค้ด Rust สำหรับแอปพลิเคชัน Desktop (Tauri)

## Coding Patterns (รูปแบบการเขียนโค้ด)

### Creating Components (การสร้าง Component)
- เก็บ UI components ที่ใช้ร่วมกันไว้ใน `src/components/ui`
- ใช้รูปแบบของ `shadcn/ui` (Radix UI + Class Variance Authority)
- ใช้ Tailwind CSS v4 สำหรับการตกแต่งสวยงาม (Styling) ตลอดทั้งโปรเจค

### Firebase Integration (การเชื่อมต่อ Firebase)
- ใช้ `src/lib/firebase.ts` ในการตั้งค่าและเรียกใช้ Firebase instance
- เข้าถึง Firestore collections ผ่านอินสแตนซ์ที่ตั้งค่าไว้
- หน้าที่ๆ มีความซับซ้อนหรืองานที่ต้องประมวลผลนาน ให้ใช้ Cloud Functions ในโฟลเดอร์ `/functions`

### Internationalization (การจัดการหลายภาษา)
- เพิ่มชุดข้อความใหม่ที่ `src/lib/dictionaries/en.ts` และ `src/lib/dictionaries/th.ts`
- ใช้ `useI18n` hook (ตรวจสอบการใช้งานที่ `src/lib/i18n-context.tsx`) เพื่อดึงข้อความมาแสดง

## Common Workflows (กระบวนการทำงานปกติ)

### Deployment (การนำขึ้นใช้งาน)
- เว็บไซต์: รัน `npm run build` จากนั้นรัน `firebase deploy --only hosting`
- Functions: รัน `firebase deploy --only functions`

### Local Development (การรันในเครื่อง)
- เว็บไซต์: รัน `npm run dev`
- Desktop: รัน `npm run tauri dev`

## Tooling & Utilities (เครื่องมือและอื่นๆ)

- `src/lib/utils.ts`: ฟังก์ชันเสริมทั่วไป (เช่น `cn` สำหรับรวมคลาส Tailwind)
- `src/lib/ai-service.ts`: การเชื่อมต่อกับ Google Generative AI (Gemini)
