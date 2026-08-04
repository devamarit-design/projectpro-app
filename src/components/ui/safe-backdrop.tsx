"use client"

import * as React from "react"
import { ConfirmDialog } from "./confirm-dialog"

interface SafeBackdropProps {
    onClose: () => void
    className?: string
}

/**
 * A backdrop overlay that shows a confirmation dialog before closing.
 * Use this in form popups where accidental outside clicks could lose user data.
 */
export function SafeBackdrop({ onClose, className }: SafeBackdropProps) {
    const [showConfirm, setShowConfirm] = React.useState(false)

    return (
        <>
            <div
                className={className || "absolute inset-0 bg-black/60 backdrop-blur-sm"}
                onClick={() => setShowConfirm(true)}
            />
            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false)
                    onClose()
                }}
                title="ปิดหน้าต่างนี้?"
                message="ข้อมูลที่กรอกอยู่จะไม่ถูกบันทึก"
                confirmText="ปิดทิ้ง"
                cancelText="กรอกต่อ"
                variant="warning"
            />
        </>
    )
}
