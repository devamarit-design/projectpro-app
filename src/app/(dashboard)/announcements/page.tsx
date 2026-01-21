"use client"

import { useState } from "react"
import { useSettings, Notice } from "@/context/settings-context"
import { useProjects } from "@/context/project-context"
import { Megaphone, Plus, Calendar, Trash2, Edit2, X } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { useTranslation } from "@/lib/i18n-context"

export default function AnnouncementsPage() {
    const { notices, updateNotices } = useSettings()
    const { currentUser } = useProjects()
    const { locale } = useTranslation()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null)

    // Form state
    const [content, setContent] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [type, setType] = useState<'info' | 'warning' | 'success'>('info')

    // Role check: Accountant and above can edit
    const allowedRoles = ['Owner', 'Admin', 'Manager', 'Accountant']
    const canEdit = currentUser?.role && allowedRoles.includes(currentUser.role)

    const today = new Date().toISOString().split('T')[0]

    const handleOpenCreate = () => {
        setEditingNotice(null)
        setContent("")
        setStartDate(today)
        setEndDate("")
        setType('info')
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (notice: Notice) => {
        setEditingNotice(notice)
        setContent(notice.content)
        setStartDate(notice.startDate)
        setEndDate(notice.endDate)
        setType(notice.type || 'info')
        setIsDialogOpen(true)
    }

    const handleSave = () => {
        if (!content || !startDate || !endDate) return

        if (editingNotice) {
            // Update existing
            const updated = notices.map(n =>
                n.id === editingNotice.id
                    ? { ...n, content, startDate, endDate, type }
                    : n
            )
            updateNotices(updated)
        } else {
            // Create new
            const newNotice: Notice = {
                id: `notice_${Date.now()}`,
                content,
                startDate,
                endDate,
                type,
                createdBy: currentUser?.id || 'unknown',
                createdAt: new Date().toISOString()
            }
            updateNotices([...notices, newNotice])
        }

        setIsDialogOpen(false)
    }

    const handleDelete = (id: string) => {
        if (!confirm("ต้องการลบประกาศนี้ใช่หรือไม่?")) return
        updateNotices(notices.filter(n => n.id !== id))
    }

    const getTypeStyle = (t: string) => {
        switch (t) {
            case 'warning': return 'bg-amber-500/10 border-amber-500/30 text-amber-600'
            case 'success': return 'bg-green-500/10 border-green-500/30 text-green-600'
            default: return 'bg-blue-500/10 border-blue-500/30 text-blue-600'
        }
    }

    const isActive = (notice: Notice) => {
        return notice.startDate <= today && notice.endDate >= today
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary font-sans flex items-center gap-3">
                        <Megaphone className="w-8 h-8" />
                        ประกาศองค์กร
                    </h1>
                    <p className="text-muted-foreground mt-2">ข่าวสาร ประกาศ และวันหยุดขององค์กร</p>
                </div>
                {canEdit && (
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        สร้างประกาศ
                    </button>
                )}
            </div>

            {notices.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>ยังไม่มีประกาศ</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notice) => (
                        <div
                            key={notice.id}
                            className={`bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden ${!isActive(notice) ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getTypeStyle(notice.type || 'info')}`}>
                                            {notice.type === 'warning' ? '⚠️ สำคัญ' : notice.type === 'success' ? '✅ ดีใจ' : 'ℹ️ ข่าวสาร'}
                                        </span>
                                        {isActive(notice) ? (
                                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">กำลังแสดง</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">หมดอายุ/ยังไม่เริ่ม</span>
                                        )}
                                    </div>
                                    <p className="text-lg font-semibold">{notice.content}</p>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(notice.startDate), "d MMM yyyy", { locale: locale === 'th' ? th : undefined })} - {format(new Date(notice.endDate), "d MMM yyyy", { locale: locale === 'th' ? th : undefined })}
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(notice)}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(notice.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsDialogOpen(false)}>
                    <div className="bg-card border rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">{editingNotice ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</h3>
                            <button onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">เนื้อหาประกาศ</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="เช่น: วันหยุดสงกรานต์ 13-16 เมษายน"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">วันที่เริ่ม</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">วันที่หมดอายุ</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">ประเภท</label>
                                <div className="flex gap-2">
                                    {(['info', 'warning', 'success'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${type === t ? getTypeStyle(t) + ' ring-2 ring-offset-2 ring-offset-background ring-current' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {t === 'info' ? 'ℹ️ ข่าวสาร' : t === 'warning' ? '⚠️ สำคัญ' : '✅ ดีใจ'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!content || !startDate || !endDate}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {editingNotice ? 'บันทึก' : 'สร้างประกาศ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
