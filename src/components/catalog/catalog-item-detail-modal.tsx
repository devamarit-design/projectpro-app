"use client"

import * as React from "react"
import {
    X,
    Package,
    Store,
    Phone,
    MapPin,
    ExternalLink,
    Calendar,
    FolderKanban,
    Tag,
    Edit3,
    Trash2,
    Share2,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Clock,
    User,
    ShoppingBag
} from "lucide-react"
import { CatalogItem } from "@/types/catalog"
import { deleteCatalogItem } from "@/lib/services/catalog-service"
import { Lightbox } from "@/components/ui/lightbox"
import { useProjects } from "@/context/project-context"
import Image from "next/image"

interface CatalogItemDetailModalProps {
    item: CatalogItem | null
    isOpen: boolean
    onClose: () => void
    onEdit: (item: CatalogItem) => void
    onDeleted?: (id: string) => void
}

export function CatalogItemDetailModal({
    item,
    isOpen,
    onClose,
    onEdit,
    onDeleted
}: CatalogItemDetailModalProps) {
    const { vendors } = useProjects()
    const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0)
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false)
    const [copiedPhone, setCopiedPhone] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const matchingVendor = React.useMemo(() => {
        if (!item) return null
        return (vendors || []).find(v => (item.storeId && v.id === item.storeId) || (v.name && item.storeName && v.name.trim().toLowerCase() === item.storeName.trim().toLowerCase()))
    }, [vendors, item])

    React.useEffect(() => {
        if (isOpen) {
            setSelectedPhotoIndex(0)
            setCopiedPhone(false)
            setIsDeleting(false)
        }
    }, [isOpen, item?.id])

    if (!isOpen || !item) return null

    const photos = item.photos && item.photos.length > 0 ? item.photos : []
    const currentPhoto = photos[selectedPhotoIndex] || null

    const handleCopyPhone = () => {
        if (!item.storePhone) return
        navigator.clipboard.writeText(item.storePhone)
        setCopiedPhone(true)
        setTimeout(() => setCopiedPhone(false), 2000)
    }

    const handleDelete = async () => {
        if (!confirm(`คุณต้องการลบ "${item.name}" ออกจาก Catalog หรือไม่?`)) return
        setIsDeleting(true)
        try {
            await deleteCatalogItem(item.id)
            if (onDeleted) onDeleted(item.id)
            onClose()
        } catch (error) {
            console.error("Failed to delete catalog item:", error)
            alert("ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง")
        } finally {
            setIsDeleting(false)
        }
    }

    const prevPhoto = () => {
        if (photos.length <= 1) return
        setSelectedPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))
    }

    const nextPhoto = () => {
        if (photos.length <= 1) return
        setSelectedPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap">
                                {item.category || "วัสดุทั่วไป"}
                            </span>
                            {item.code && (
                                <span className="px-2 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground">
                                    {item.code}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">แก้ไข</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">ลบ</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Title and Price Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                                    {item.name}
                                </h1>
                                {/* Tagged Projects */}
                                {((item.projectNames && item.projectNames.length > 0) || item.projectName) && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                                            <FolderKanban className="w-3.5 h-3.5 text-primary" />
                                            <span>โครงการที่ใช้งาน:</span>
                                        </span>
                                        {(item.projectNames && item.projectNames.length > 0 ? item.projectNames : [item.projectName!]).map((pName, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                                            >
                                                <span>🏷️ {pName}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Price Badge */}
                            <div className="flex flex-col sm:items-end bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-2xl">
                                <span className="text-xs text-muted-foreground">ราคาต่อหน่วย</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-primary">
                                        ฿{Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        / {item.unit || "ชิ้น"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Photo Album Section */}
                        {photos.length > 0 ? (
                            <div className="space-y-3">
                                {/* Featured / Selected Photo */}
                                <div className="relative aspect-video sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-black/5 dark:bg-muted/40 border border-border group">
                                    {currentPhoto && (
                                        <Image
                                            src={currentPhoto}
                                            alt={item.name}
                                            fill
                                            priority
                                            sizes="(max-width: 1024px) 100vw, 800px"
                                            className="object-contain"
                                        />
                                    )}

                                    {/* Action Buttons overlay */}
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsLightboxOpen(true)}
                                            className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md backdrop-blur-sm"
                                            title="ดูภาพขนาดเต็ม"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Prev/Next arrows if multiple photos */}
                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={prevPhoto}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors opacity-80 hover:opacity-100 shadow-md"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={nextPhoto}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors opacity-80 hover:opacity-100 shadow-md"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
                                                {selectedPhotoIndex + 1} / {photos.length} รูป
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnail Strip */}
                                {photos.length > 1 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                        {photos.map((photoUrl, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedPhotoIndex(idx)}
                                                className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                                                    selectedPhotoIndex === idx
                                                        ? "border-primary ring-2 ring-primary/20 scale-105"
                                                        : "border-border opacity-70 hover:opacity-100"
                                                }`}
                                            >
                                                <Image
                                                    src={photoUrl}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    fill
                                                    sizes="64px"
                                                    className="object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl border border-dashed border-border bg-muted/20 text-center space-y-2">
                                <Package className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                                <p className="text-sm text-muted-foreground">ไม่มีรูปภาพประกอบสำหรับรายการนี้</p>
                                <button
                                    type="button"
                                    onClick={() => onEdit(item)}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    + เพิ่มรูปภาพเข้าอัลบั้ม
                                </button>
                            </div>
                        )}

                        {/* Store & Supplier Contact Card */}
                        <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Store className="w-4 h-4 text-primary" />
                                    แหล่งซื้อ / ข้อมูลร้านค้า
                                </h3>
                                {matchingVendor ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                        <Check className="w-3 h-3" />
                                        ร้านค้าในระบบ (Store Partner)
                                    </span>
                                ) : item.storeName ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                        <ShoppingBag className="w-3 h-3" />
                                        ร้านค้านอกสโตร์ (ซื้อทั่วไป/หน้างาน)
                                    </span>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-muted-foreground">ชื่อร้านค้า / ตัวแทน</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-sm font-semibold text-foreground">
                                            {item.storeName || "ไม่ระบุร้านค้า"}
                                        </p>
                                        {matchingVendor?.category && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                                {matchingVendor.category}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs text-muted-foreground">เบอร์โทรติดต่อ</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {item.storePhone ? (
                                            <>
                                                <a
                                                    href={`tel:${item.storePhone.replace(/[^0-9]/g, "")}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm"
                                                >
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {item.storePhone}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={handleCopyPhone}
                                                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    title="คัดลอกเบอร์โทร"
                                                >
                                                    {copiedPhone ? (
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">ไม่ระบุเบอร์โทร</span>
                                        )}
                                    </div>
                                </div>

                                {item.storeLocation && (
                                    <div className="sm:col-span-2">
                                        <span className="text-xs text-muted-foreground">ที่ตั้ง / ที่อยู่</span>
                                        <p className="text-sm text-foreground flex items-start gap-1.5 mt-0.5">
                                            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <span>{item.storeLocation}</span>
                                        </p>
                                    </div>
                                )}

                                {item.storeMapUrl && (
                                    <div className="sm:col-span-2">
                                        <a
                                            href={item.storeMapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            เปิดดูตำแหน่งร้านบน Google Maps
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description & Specifications */}
                        {item.description && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-foreground">
                                    รายละเอียดสเปค / บันทึกการใช้งาน
                                </h3>
                                <div className="p-4 rounded-xl bg-card border border-border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                    {item.description}
                                </div>
                            </div>
                        )}

                        {/* Audit Meta Information */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                <span>บันทึกโดย: <strong className="text-foreground">{item.createdByName || "ผู้ใช้งาน"}</strong> ({item.createdByRole || "Member"})</span>
                            </div>

                            {item.lastPurchasedDate && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>วันที่สำรวจ/สั่งซื้อ: {item.lastPurchasedDate}</span>
                                </div>
                            )}

                            {item.updatedAt && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>อัปเดตเมื่อ: {new Date(item.updatedAt).toLocaleDateString("th-TH")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox for zooming full photos */}
            {currentPhoto && (
                <Lightbox
                    open={isLightboxOpen}
                    onOpenChange={setIsLightboxOpen}
                    src={currentPhoto}
                    alt={item.name}
                />
            )}
        </>
    )
}
