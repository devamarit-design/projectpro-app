'use client'

import { useState } from 'react'
import { useSettings, DocumentTemplate } from '@/context/settings-context'
import { Palette, Image as ImageIcon, Type, Columns, Eye, EyeOff, GripVertical, ChevronLeft, Save, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Column Item Component
function SortableColumnItem({ column, onToggle }: { column: { id: string, label: string, visible: boolean, order: number }, onToggle: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </button>
                <span className="font-medium">{column.label}</span>
            </div>
            <button onClick={onToggle} className={column.visible ? "text-green-500" : "text-muted-foreground"}>
                {column.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
        </div>
    )
}

export default function TemplateEditorPage() {
    const { documentSettings, updateDocumentTemplate, orgProfile } = useSettings()

    // Document Type Selector
    const [docType, setDocType] = useState<'quotation' | 'invoice' | 'receipt'>('quotation')
    const template = documentSettings[docType] || documentSettings['quotation']

    // Local State for Live Editing
    const [localTemplate, setLocalTemplate] = useState<DocumentTemplate>(template)
    const [hasChanges, setHasChanges] = useState(false)

    // Sync when doc type changes
    const handleDocTypeChange = (type: 'quotation' | 'invoice' | 'receipt') => {
        setDocType(type)
        setLocalTemplate(documentSettings[type] || documentSettings['quotation'])
        setHasChanges(false)
    }

    // Update local template
    const updateLocal = (updates: Partial<DocumentTemplate>) => {
        setLocalTemplate(prev => ({ ...prev, ...updates }))
        setHasChanges(true)
    }

    // Save to Context
    const handleSave = () => {
        updateDocumentTemplate(docType, localTemplate)
        setHasChanges(false)
    }

    // Reset to Context Value
    const handleReset = () => {
        setLocalTemplate(template)
        setHasChanges(false)
    }

    // DnD Kit Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const oldIndex = localTemplate.columns.findIndex(c => c.id === active.id)
            const newIndex = localTemplate.columns.findIndex(c => c.id === over.id)
            const newColumns = arrayMove(localTemplate.columns, oldIndex, newIndex).map((col, idx) => ({ ...col, order: idx + 1 }))
            updateLocal({ columns: newColumns })
        }
    }

    const toggleColumnVisibility = (columnId: string) => {
        const newColumns = localTemplate.columns.map(col =>
            col.id === columnId ? { ...col, visible: !col.visible } : col
        )
        updateLocal({ columns: newColumns })
    }

    // Color Presets
    const colorPresets = [
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Green', value: '#10b981' },
        { name: 'Purple', value: '#8b5cf6' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Teal', value: '#14b8a6' },
        { name: 'Pink', value: '#ec4899' },
        { name: 'Black', value: '#000000' },
    ]

    // Font Options
    const fontOptions = ['Kanit', 'Sarabun', 'Prompt', 'IBM Plex Sans Thai', 'Noto Sans Thai']

    // Logo Position Options
    const logoPositions = [
        { label: 'ซ้าย', value: 'left' },
        { label: 'กลาง', value: 'center' },
        { label: 'ขวา', value: 'right' },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/settings" className="p-2 hover:bg-muted rounded-lg">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Template Editor</h1>
                            <p className="text-sm text-muted-foreground">ปรับแต่งหน้าตาใบเสนอราคา / ใบเสร็จ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <>
                                <button onClick={handleReset} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    ยกเลิก
                                </button>
                                <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:opacity-90">
                                    <Save className="w-4 h-4" />
                                    บันทึก
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left - Settings Panel */}
                <div className="space-y-6">
                    {/* Document Type Selector */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">ประเภทเอกสาร</h3>
                        <div className="flex gap-2">
                            {[
                                { id: 'quotation', label: 'ใบเสนอราคา' },
                                { id: 'invoice', label: 'ใบวางบิล' },
                                { id: 'receipt', label: 'ใบเสร็จ' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleDocTypeChange(type.id as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${docType === type.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/30 hover:bg-muted/50'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Color */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                        <div className="flex items-center gap-2 mb-4">
                            <Palette className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-medium">สี Theme</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {colorPresets.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => updateLocal({ accentColor: color.value })}
                                    className={`w-full aspect-square rounded-xl transition-all ${localTemplate.accentColor === color.value
                                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                        : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <div className="mt-4">
                            <label className="text-xs text-muted-foreground">สีที่กำหนดเอง</label>
                            <input
                                type="color"
                                value={localTemplate.accentColor}
                                onChange={(e) => updateLocal({ accentColor: e.target.value })}
                                className="w-full h-10 rounded-lg cursor-pointer mt-1"
                            />
                        </div>
                    </div>

                    {/* Logo Settings */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-medium">โลโก้</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span>แสดงโลโก้</span>
                                <button
                                    onClick={() => updateLocal({ logoVisible: !localTemplate.logoVisible })}
                                    className={`w-12 h-6 rounded-full transition-all ${localTemplate.logoVisible ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${localTemplate.logoVisible ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Font Settings */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                        <div className="flex items-center gap-2 mb-4">
                            <Type className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-medium">ฟอนต์</h3>
                        </div>
                        <select
                            value={localTemplate.font}
                            onChange={(e) => updateLocal({ font: e.target.value })}
                            className="w-full p-3 rounded-lg bg-muted/30 border-none focus:ring-2 focus:ring-primary"
                        >
                            {fontOptions.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                    </div>

                    {/* Column Visibility & Order */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                        <div className="flex items-center gap-2 mb-4">
                            <Columns className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-medium">คอลัมน์ (ลากเพื่อเรียงลำดับ)</h3>
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={localTemplate.columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {localTemplate.columns.sort((a, b) => a.order - b.order).map(column => (
                                        <SortableColumnItem
                                            key={column.id}
                                            column={column}
                                            onToggle={() => toggleColumnVisibility(column.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                {/* Right - Live Preview */}
                <div className="lg:sticky lg:top-24 h-fit">
                    <div className="bg-card rounded-2xl p-4 border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">ตัวอย่าง Preview</h3>
                        <div
                            className="bg-white text-black rounded-lg shadow-lg p-6 aspect-[210/297] overflow-hidden"
                            style={{ fontFamily: localTemplate.font }}
                        >
                            {/* Preview Header */}
                            <div className="flex justify-between items-start mb-6 pb-4" style={{ borderBottom: `2px solid ${localTemplate.accentColor}` }}>
                                <div className="flex gap-3">
                                    {localTemplate.logoVisible && (
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                                            style={{ backgroundColor: localTemplate.accentColor }}
                                        >
                                            {orgProfile?.name?.charAt(0) || 'C'}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold text-sm">{orgProfile?.name || 'Company Name'}</div>
                                        <div className="text-[8px] text-gray-500 max-w-[120px]">{orgProfile?.address || '123 Address'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold uppercase tracking-wide" style={{ color: localTemplate.accentColor }}>
                                        {docType === 'quotation' ? 'QUOTATION' : docType === 'invoice' ? 'INVOICE' : 'RECEIPT'}
                                    </div>
                                    <div className="text-[8px] text-gray-400">ORIGINAL</div>
                                    <div className="text-[8px] mt-1">
                                        <span className="text-gray-400">NO.</span> QT-2024-001
                                    </div>
                                </div>
                            </div>

                            {/* Preview Table Header */}
                            <div
                                className="flex text-[8px] font-bold py-2 border-b"
                                style={{ borderColor: localTemplate.accentColor, color: localTemplate.accentColor }}
                            >
                                {localTemplate.columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(col => (
                                    <div key={col.id} className={`${col.id === 'description' ? 'flex-1' : 'w-12 text-right'}`}>
                                        {col.label}
                                    </div>
                                ))}
                            </div>

                            {/* Preview Rows */}
                            {[1, 2].map(i => (
                                <div key={i} className="flex text-[8px] py-2 border-b border-gray-100">
                                    {localTemplate.columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(col => (
                                        <div key={col.id} className={`${col.id === 'description' ? 'flex-1' : 'w-12 text-right'}`}>
                                            {col.id === 'item' ? i : col.id === 'description' ? `รายการที่ ${i}` : col.id === 'qty' ? '1' : col.id === 'unit' ? 'ชิ้น' : '1,000'}
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {/* Preview Total */}
                            <div className="flex justify-end mt-4 pt-2 border-t" style={{ borderColor: localTemplate.accentColor }}>
                                <div className="text-right">
                                    <div className="text-[8px] text-gray-400">Grand Total</div>
                                    <div className="text-sm font-bold" style={{ color: localTemplate.accentColor }}>฿ 2,000.00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
