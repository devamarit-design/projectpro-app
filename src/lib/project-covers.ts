export interface ProjectCoverPreset {
    id: string
    title: string
    category: 'house' | 'office' | 'retail' | 'renovation' | 'structure' | 'industrial'
    categoryLabel: string
    url: string
    thumbnail: string
    keywords: string[]
}

export const PROJECT_COVER_CATEGORIES = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'house', label: 'บ้าน & วิลล่า' },
    { id: 'office', label: 'ออฟฟิศ & อาคาร' },
    { id: 'retail', label: 'ร้านค้า & คาเฟ่' },
    { id: 'renovation', label: 'รีโนเวท & ภายใน' },
    { id: 'structure', label: 'ไซต์งาน & โครงสร้าง' },
    { id: 'industrial', label: 'โรงงาน & โกดัง' },
] as const

export const PROJECT_COVER_PRESETS: ProjectCoverPreset[] = [
    // --- บ้าน & วิลล่า (Residential & Luxury Villas) ---
    {
        id: 'house-modern-villa',
        title: 'Modern Pool Villa',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        url: 'https://images.unsplash.com/photo-1600596542815-e32c2159c82c?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1600596542815-e32c2159c82c?w=400&q=80',
        keywords: ['บ้าน', 'วิลล่า', 'villa', 'house', 'residence', 'pool']
    },
    {
        id: 'house-warm-contemporary',
        title: 'Contemporary Luxury Residence',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
        keywords: ['บ้าน', 'house', 'residence', 'home', 'contemporary']
    },
    {
        id: 'house-minimal-nordic',
        title: 'Nordic Minimal Home',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
        keywords: ['มินิมอล', 'นอร์ดิก', 'minimal', 'nordic', 'house']
    },
    {
        id: 'house-warm-timber',
        title: 'Warm Architectural House',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
        keywords: ['บ้าน', 'ไม้', 'wood', 'timber', 'warm']
    },
    {
        id: 'house-glass-pavilion',
        title: 'Glass Pavilion Residence',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80',
        keywords: ['กระจก', 'glass', 'pavilion', 'modern']
    },
    {
        id: 'house-modern-facade-white',
        title: 'Geometric White Residence',
        category: 'house',
        categoryLabel: 'บ้าน & วิลล่า',
        url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80',
        keywords: ['บ้าน', 'white', 'modern', 'residence']
    },

    // --- ออฟฟิศ & อาคารพาณิชย์ (Offices & Commercial) ---
    {
        id: 'office-corporate-glass',
        title: 'Corporate Glass Tower',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80',
        keywords: ['ออฟฟิศ', 'สำนักงาน', 'office', 'corporate', 'tower', 'ตึก']
    },
    {
        id: 'office-modern-facade',
        title: 'Architectural Office Facade',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&q=80',
        keywords: ['อาคาร', 'ตึก', 'building', 'facade', 'commercial']
    },
    {
        id: 'office-workspace-studio',
        title: 'Modern Creative Studio',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        url: 'https://images.unsplash.com/photo-1497215842964-222b430dc0a1?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1497215842964-222b430dc0a1?w=400&q=80',
        keywords: ['สตูดิโอ', 'studio', 'coworking', 'workspace']
    },
    {
        id: 'office-minimal-atrium',
        title: 'Minimalist Office Atrium',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&q=80',
        keywords: ['บริษัท', 'สำนักงาน', 'atrium', 'lobby']
    },
    {
        id: 'office-urban-commercial',
        title: 'Contemporary Urban Center',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
        keywords: ['พาณิชย์', 'commercial', 'office', 'center']
    },
    {
        id: 'office-sleek-architecture',
        title: 'Sleek Corporate Architecture',
        category: 'office',
        categoryLabel: 'ออฟฟิศ & อาคาร',
        url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&q=80',
        keywords: ['สำนักงานใหญ่', 'headquarters', 'corporate']
    },

    // --- ร้านค้า & คาเฟ่ (Retail & Cafes & Dining) ---
    {
        id: 'retail-boutique-storefront',
        title: 'Boutique Storefront',
        category: 'retail',
        categoryLabel: 'ร้านค้า & คาเฟ่',
        url: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400&q=80',
        keywords: ['ร้าน', 'ช็อป', 'shop', 'store', 'boutique', 'retail']
    },
    {
        id: 'retail-warm-cafe',
        title: 'Urban Artisan Cafe',
        category: 'retail',
        categoryLabel: 'ร้านค้า & คาเฟ่',
        url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80',
        keywords: ['คาเฟ่', 'cafe', 'กาแฟ', 'coffee', 'bakery']
    },
    {
        id: 'retail-luxury-restaurant',
        title: 'Modern Restaurant & Bistro',
        category: 'retail',
        categoryLabel: 'ร้านค้า & คาเฟ่',
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
        keywords: ['อาหาร', 'ภัตตาคาร', 'restaurant', 'bistro', 'bar']
    },
    {
        id: 'retail-concept-store',
        title: 'Modern Concept Store',
        category: 'retail',
        categoryLabel: 'ร้านค้า & คาเฟ่',
        url: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=400&q=80',
        keywords: ['ร้านค้า', 'concept', 'showroom', 'โชว์รูม']
    },

    // --- รีโนเวท & อินทีเรียร์ (Renovation & Interior Design) ---
    {
        id: 'reno-warm-loft',
        title: 'Modern Loft Renovation',
        category: 'renovation',
        categoryLabel: 'รีโนเวท & ภายใน',
        url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&q=80',
        keywords: ['รีโนเวท', 'รีโนเวต', 'ลอฟท์', 'loft', 'renovate', 'renovation']
    },
    {
        id: 'reno-minimal-living',
        title: 'Minimalist Interior Living',
        category: 'renovation',
        categoryLabel: 'รีโนเวท & ภายใน',
        url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
        keywords: ['อินทีเรีย', 'ตกแต่งภายใน', 'interior', 'living']
    },
    {
        id: 'reno-architectural-kitchen',
        title: 'Modern Architectural Space',
        category: 'renovation',
        categoryLabel: 'รีโนเวท & ภายใน',
        url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&q=80',
        keywords: ['ครัว', 'kitchen', 'remodel', 'fitout']
    },

    // --- ไซต์งาน & โครงสร้าง (Site, Structure & Construction) ---
    {
        id: 'struct-steel-concrete',
        title: 'Structural Steel & Concrete',
        category: 'structure',
        categoryLabel: 'ไซต์งาน & โครงสร้าง',
        url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80',
        keywords: ['ไซต์', 'โครงสร้าง', 'เสา', 'คาน', 'site', 'structure', 'construction']
    },
    {
        id: 'struct-blueprint-geometry',
        title: 'Architectural Blueprint & Design',
        category: 'structure',
        categoryLabel: 'ไซต์งาน & โครงสร้าง',
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
        keywords: ['แบบ', 'แปลน', 'blueprint', 'drawing', 'plan']
    },
    {
        id: 'struct-concrete-forms',
        title: 'Geometric Concrete Forms',
        category: 'structure',
        categoryLabel: 'ไซต์งาน & โครงสร้าง',
        url: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80',
        keywords: ['คอนกรีต', 'concrete', 'formwork', 'architecture']
    },

    // --- โรงงาน & โกดัง & ขนส่ง (Industrial & Facilities) ---
    {
        id: 'ind-modern-warehouse',
        title: 'Modern Logistics & Warehouse',
        category: 'industrial',
        categoryLabel: 'โรงงาน & โกดัง',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
        keywords: ['โกดัง', 'คลัง', 'โรงงาน', 'warehouse', 'logistics', 'industrial', 'น้ำมัน']
    },
    {
        id: 'ind-minimal-facility',
        title: 'Architectural Steel Facility',
        category: 'industrial',
        categoryLabel: 'โรงงาน & โกดัง',
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
        keywords: ['อาคารอุตสาหกรรม', 'facility', 'plant', 'steel']
    },
]

/**
 * URLs that are known generic placeholders that made all projects look identical
 */
const GENERIC_PLACEHOLDER_SUBSTRINGS = [
    'photo-1497366216548-37526070297c', // Dark office hallway corridor
    'photo-1586023492125-27b2c045efd7', // Chair in room
]

/**
 * Checks whether an image URL is a generic, repetitive placeholder
 */
export function isGenericPlaceholderCover(url?: string | null): boolean {
    if (!url || typeof url !== 'string') return true
    const trimmed = url.trim()
    if (!trimmed || trimmed === '#' || trimmed === 'about:blank') return true

    return GENERIC_PLACEHOLDER_SUBSTRINGS.some(pattern => trimmed.includes(pattern))
}

/**
 * DJB2 string hash helper for even, deterministic distribution
 */
function hashString(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
        hash = hash & hash
    }
    return Math.abs(hash)
}

/**
 * Intelligently resolves the best project cover image:
 * 1. If project has a custom user-uploaded image (or valid non-placeholder URL), keeps it.
 * 2. If it is empty or the generic repetitive hallway placeholder, picks a category-aware
 *    architectural preset based on project name keywords (e.g. "บ้าน", "ออฟฟิศ", "ร้าน", "รีโนเวท").
 * 3. Uses a deterministic hash based on project id/name so that projects of the same type
 *    (e.g., "บ้านคุณไก่" vs "บ้านคุณตาล" vs "บ้านเจ้านาย") get DIFFERENT, distinct presets!
 */
export function getSmartProjectCover(project: {
    id?: string
    name?: string
    image?: string
    imageUrl?: string
}): string {
    const rawUrl = project.image || project.imageUrl

    // If it's a real custom image (and not our duplicate generic hallway), keep it!
    if (rawUrl && !isGenericPlaceholderCover(rawUrl)) {
        return rawUrl
    }

    const name = (project.name || '').toLowerCase()
    const id = project.id || name || 'default-project'
    // Combine name and id with prime offset for diverse distribution
    const hash = hashString(`${name}#${id}`)

    // Keyword detection
    let matchedCategory: ProjectCoverPreset['category'] | null = null

    if (name.includes('รีโนเวท') || name.includes('รีโนเวต') || name.includes('ตกแต่ง') || name.includes('interior') || name.includes('renovate')) {
        matchedCategory = 'renovation'
    } else if (name.includes('บ้าน') || name.includes('วิลล่า') || name.includes('villa') || name.includes('house') || name.includes('home') || name.includes('residence')) {
        matchedCategory = 'house'
    } else if (name.includes('ออฟฟิศ') || name.includes('สำนักงาน') || name.includes('ตึก') || name.includes('อาคาร') || name.includes('office') || name.includes('corporate') || name.includes('building')) {
        matchedCategory = 'office'
    } else if (name.includes('ร้าน') || name.includes('คาเฟ่') || name.includes('ช็อป') || name.includes('สาขา') || name.includes('shop') || name.includes('cafe') || name.includes('store') || name.includes('retail')) {
        matchedCategory = 'retail'
    } else if (name.includes('โกดัง') || name.includes('โรงงาน') || name.includes('น้ำมัน') || name.includes('คลัง') || name.includes('warehouse') || name.includes('factory') || name.includes('industrial')) {
        matchedCategory = 'industrial'
    } else if (name.includes('ไซต์') || name.includes('โครงสร้าง') || name.includes('งานโครงสร้าง') || name.includes('site') || name.includes('structure') || name.includes('แปลน')) {
        matchedCategory = 'structure'
    }

    if (matchedCategory) {
        const categoryPresets = PROJECT_COVER_PRESETS.filter(p => p.category === matchedCategory)
        if (categoryPresets.length > 0) {
            return categoryPresets[hash % categoryPresets.length].url
        }
    }

    // Fallback: pick deterministically from the full pool
    return PROJECT_COVER_PRESETS[hash % PROJECT_COVER_PRESETS.length].url
}
