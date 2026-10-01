import {
    Home,
    Building2,
    Store,
    Paintbrush,
    HardHat,
    Warehouse,
    Compass,
    Sparkles,
    Layers,
    Castle,
    type LucideIcon
} from "lucide-react"

export interface ProjectThemeConfig {
    id: string
    title: string
    category: 'house' | 'office' | 'retail' | 'renovation' | 'structure' | 'industrial' | 'minimal'
    categoryLabel: string
    gradientClass: string
    glowColor: string
    borderColor: string
    badgeBg: string
    iconColor: string
    bgTint: string
    icon: LucideIcon
    iconName: string
    keywords: string[]
}

export const PROJECT_THEMES: ProjectThemeConfig[] = [
    {
        id: 'emerald-villa',
        title: 'มรกตเอเมอรัลด์ (บ้าน & วิลล่า)',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        gradientClass: 'from-emerald-950/80 via-emerald-900/30 to-slate-950',
        glowColor: 'rgba(16, 185, 129, 0.28)',
        borderColor: 'border-emerald-500/30 group-hover:border-emerald-500/60',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        iconColor: 'text-emerald-400',
        bgTint: '#064e3b',
        icon: Home,
        iconName: 'Home',
        keywords: ['บ้าน', 'วิลล่า', 'villa', 'house', 'residence', 'home']
    },
    {
        id: 'indigo-residence',
        title: 'อินดิโก้ (บ้านพักอาศัยโมเดิร์น)',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        gradientClass: 'from-indigo-950/80 via-indigo-900/30 to-slate-950',
        glowColor: 'rgba(99, 102, 241, 0.28)',
        borderColor: 'border-indigo-500/30 group-hover:border-indigo-500/60',
        badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        iconColor: 'text-indigo-400',
        bgTint: '#312e81',
        icon: Castle,
        iconName: 'Castle',
        keywords: ['บ้าน', 'residence', 'คฤหาสน์', 'mansion']
    },
    {
        id: 'sapphire-office',
        title: 'แซฟไฟร์ (ออฟฟิศ & ทาวเวอร์)',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        gradientClass: 'from-blue-950/80 via-blue-900/30 to-slate-950',
        glowColor: 'rgba(59, 130, 246, 0.28)',
        borderColor: 'border-blue-500/30 group-hover:border-blue-500/60',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        iconColor: 'text-blue-400',
        bgTint: '#1e3a8a',
        icon: Building2,
        iconName: 'Building2',
        keywords: ['ออฟฟิศ', 'สำนักงาน', 'office', 'corporate', 'tower', 'ตึก']
    },
    {
        id: 'cyan-commercial',
        title: 'ไซแอน (อาคารพาณิชย์ & สตูดิโอ)',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        gradientClass: 'from-cyan-950/80 via-cyan-900/30 to-slate-950',
        glowColor: 'rgba(6, 182, 212, 0.28)',
        borderColor: 'border-cyan-500/30 group-hover:border-cyan-500/60',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        iconColor: 'text-cyan-400',
        bgTint: '#164e63',
        icon: Layers,
        iconName: 'Layers',
        keywords: ['อาคาร', 'commercial', 'studio', 'สตูดิโอ']
    },
    {
        id: 'amber-store',
        title: 'อำพันแอมเบอร์ (ร้านค้า & คาเฟ่)',
        category: 'retail',
        categoryLabel: 'ร้านค้า & คาเฟ่',
        gradientClass: 'from-amber-950/80 via-amber-900/30 to-slate-950',
        glowColor: 'rgba(245, 158, 11, 0.28)',
        borderColor: 'border-amber-500/30 group-hover:border-amber-500/60',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        iconColor: 'text-amber-400',
        bgTint: '#78350f',
        icon: Store,
        iconName: 'Store',
        keywords: ['ร้าน', 'คาเฟ่', 'ช็อป', 'cafe', 'store', 'shop', 'อาหาร']
    },
    {
        id: 'violet-reno',
        title: 'อเมทิสต์ม่วง (รีโนเวท & อินทีเรียร์)',
        category: 'renovation',
        categoryLabel: 'รีโนเวท & ภายใน',
        gradientClass: 'from-purple-950/80 via-purple-900/30 to-slate-950',
        glowColor: 'rgba(168, 85, 247, 0.28)',
        borderColor: 'border-purple-500/30 group-hover:border-purple-500/60',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        iconColor: 'text-purple-400',
        bgTint: '#581c87',
        icon: Paintbrush,
        iconName: 'Paintbrush',
        keywords: ['รีโนเวท', 'รีโนเวต', 'ตกแต่ง', 'interior', 'renovate', 'renovation', 'ลอฟท์']
    },
    {
        id: 'ruby-site',
        title: 'รูบี้แดง (ไซต์งาน & โครงสร้าง)',
        category: 'structure',
        categoryLabel: 'ไซต์งาน & โครงสร้าง',
        gradientClass: 'from-rose-950/80 via-rose-900/30 to-slate-950',
        glowColor: 'rgba(244, 63, 94, 0.28)',
        borderColor: 'border-rose-500/30 group-hover:border-rose-500/60',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        iconColor: 'text-rose-400',
        bgTint: '#881337',
        icon: HardHat,
        iconName: 'HardHat',
        keywords: ['ไซต์', 'โครงสร้าง', 'เสา', 'คาน', 'site', 'structure', 'construction', 'แปลน']
    },
    {
        id: 'teal-industrial',
        title: 'เทอร์ควอยซ์ (โรงงาน & โกดัง)',
        category: 'industrial',
        categoryLabel: 'โรงงาน & โกดัง',
        gradientClass: 'from-teal-950/80 via-teal-900/30 to-slate-950',
        glowColor: 'rgba(20, 184, 166, 0.28)',
        borderColor: 'border-teal-500/30 group-hover:border-teal-500/60',
        badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        iconColor: 'text-teal-400',
        bgTint: '#134e4a',
        icon: Warehouse,
        iconName: 'Warehouse',
        keywords: ['โกดัง', 'คลัง', 'โรงงาน', 'warehouse', 'factory', 'industrial', 'น้ำมัน']
    },
    {
        id: 'orange-solar',
        title: 'ออเรนจ์ (สถาปัตยกรรมสร้างสรรค์)',
        category: 'retail',
        categoryLabel: 'สร้างสรรค์ & พิเศษ',
        gradientClass: 'from-orange-950/80 via-orange-900/30 to-slate-950',
        glowColor: 'rgba(249, 115, 22, 0.28)',
        borderColor: 'border-orange-500/30 group-hover:border-orange-500/60',
        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        iconColor: 'text-orange-400',
        bgTint: '#7c2d12',
        icon: Sparkles,
        iconName: 'Sparkles',
        keywords: ['พิเศษ', 'design', 'ดีไซน์']
    },
    {
        id: 'slate-titanium',
        title: 'ไทเทเนียม (โมเดิร์น มินิมอล)',
        category: 'minimal',
        categoryLabel: 'มินิมอล โมเดิร์น',
        gradientClass: 'from-slate-900/90 via-zinc-900/40 to-black',
        glowColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'border-white/20 group-hover:border-white/50',
        badgeBg: 'bg-white/10 text-white border-white/20',
        iconColor: 'text-zinc-200',
        bgTint: '#18181b',
        icon: Compass,
        iconName: 'Compass',
        keywords: ['มินิมอล', 'minimal', 'modern', 'โมเดิร์น']
    },
]

/**
 * Checks whether the image URL is a real user-uploaded photo from storage/device
 */
export function isCustomUploadedPhoto(url?: string | null): boolean {
    if (!url || typeof url !== 'string') return false
    const trimmed = url.trim()
    if (!trimmed || trimmed === '#' || trimmed === 'about:blank') return false

    // Real photos uploaded by the user to Firebase Storage or local upload (data/blob)
    if (
        trimmed.startsWith('https://firebasestorage.googleapis.com') ||
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('blob:') ||
        trimmed.startsWith('/uploads/')
    ) {
        return true
    }

    return false
}

/**
 * DJB2 string hash helper
 */
function djb2Hash(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
        hash = hash & hash
    }
    return Math.abs(hash)
}

/**
 * Resolves the best graphic color theme for a project
 */
export function getProjectTheme(project: {
    id?: string
    name?: string
    image?: string
    imageUrl?: string
}): ProjectThemeConfig {
    const rawUrl = project.image || project.imageUrl || ''

    // If an explicit theme:id was saved in project.image
    if (rawUrl.startsWith('theme:')) {
        const themeId = rawUrl.replace('theme:', '')
        const found = PROJECT_THEMES.find(t => t.id === themeId)
        if (found) return found
    }

    const name = (project.name || '').toLowerCase()
    const id = project.id || name || 'default-project'
    const hash = djb2Hash(`${name}#${id}`)

    // Semantic category matching based on project title
    if (name.includes('รีโนเวท') || name.includes('รีโนเวต') || name.includes('ตกแต่ง') || name.includes('interior') || name.includes('renovate') || name.includes('ลอฟท์')) {
        return PROJECT_THEMES.find(t => t.id === 'violet-reno') || PROJECT_THEMES[0]
    }
    if (name.includes('บ้าน') || name.includes('วิลล่า') || name.includes('villa') || name.includes('house') || name.includes('home') || name.includes('residence')) {
        const houseThemes = PROJECT_THEMES.filter(t => t.category === 'house')
        return houseThemes[hash % houseThemes.length]
    }
    if (name.includes('ออฟฟิศ') || name.includes('สำนักงาน') || name.includes('ตึก') || name.includes('อาคาร') || name.includes('office') || name.includes('corporate') || name.includes('building')) {
        const officeThemes = PROJECT_THEMES.filter(t => t.category === 'office')
        return officeThemes[hash % officeThemes.length]
    }
    if (name.includes('ร้าน') || name.includes('คาเฟ่') || name.includes('ช็อป') || name.includes('สาขา') || name.includes('shop') || name.includes('cafe') || name.includes('store') || name.includes('retail')) {
        return PROJECT_THEMES.find(t => t.id === 'amber-store') || PROJECT_THEMES[0]
    }
    if (name.includes('โกดัง') || name.includes('โรงงาน') || name.includes('น้ำมัน') || name.includes('คลัง') || name.includes('warehouse') || name.includes('factory') || name.includes('industrial')) {
        return PROJECT_THEMES.find(t => t.id === 'teal-industrial') || PROJECT_THEMES[0]
    }
    if (name.includes('ไซต์') || name.includes('โครงสร้าง') || name.includes('งานโครงสร้าง') || name.includes('site') || name.includes('structure') || name.includes('แปลน')) {
        return PROJECT_THEMES.find(t => t.id === 'ruby-site') || PROJECT_THEMES[0]
    }

    // Default: distribute evenly across themes
    return PROJECT_THEMES[hash % PROJECT_THEMES.length]
}

/**
 * Extracts a 1-2 character initials/monogram for the project
 */
export function getProjectMonogram(name?: string): string {
    if (!name) return "P"
    const cleaned = name.trim().replace(/^(บ้าน|ร้าน|ออฟฟิศ|ตึก|คุณ|โครงการ)\s*/g, '')
    const firstChar = cleaned.charAt(0) || name.charAt(0)
    return firstChar.toUpperCase()
}
