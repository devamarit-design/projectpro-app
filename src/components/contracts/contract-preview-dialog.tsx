"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Contract, useProjects } from "@/context/project-context"
import { useSettings } from "@/context/settings-context"
import { Printer, Edit, X, ZoomIn, ZoomOut, UploadCloud, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { getFunctions, httpsCallable } from "firebase/functions"
import { useOrganization } from "@/context/organization-context"
import {
    generateContractHTML,
    thDateLong,
    bahtText,
    fmtBaht,
    fmtNum,
    splitLegacyScope,
    DEFAULT_CONTRACT_TITLE,
    DEFAULT_PAYMENT_TERMS,
    DEFAULT_WARRANTY,
    DEFAULT_GENERAL_CONDITIONS
} from "@/lib/contract-utils"

interface ContractPreviewDialogProps {
    isOpen: boolean
    onClose: () => void
    contract: Contract
    onEdit: () => void
}

export function ContractPreviewDialog({ isOpen, onClose, contract, onEdit }: ContractPreviewDialogProps) {
    const { projects, workers } = useProjects()
    const { orgProfile } = useSettings()
    const { currentOrg } = useOrganization()
    const [isSavingToDrive, setIsSavingToDrive] = useState(false)

    const project = projects.find(p => p.id === contract.projectId)
    const worker = workers.find(w => w.id === contract.workerId)

    const [zoom, setZoom] = useState(0.9)
    const [activePage, setActivePage] = useState(1)
    const containerRef = useRef<HTMLDivElement>(null)

    // Calculate auto-scale
    useEffect(() => {
        if (!isOpen) return
        const handleResize = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth
                // A4 is 794px at 96dpi; target 820px with padding
                const targetScale = Math.min(1.05, Math.max(0.45, (w - 48) / 840))
                setZoom(targetScale)
            }
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [isOpen])

    if (!isOpen || typeof document === "undefined") return null

    const docNo = contract.documentNumber || contract.id.slice(0, 8).toUpperCase()
    const signDate = contract.signDate || contract.startDate || (contract.createdAt || "").slice(0, 10)
    const projectName = project?.name || "-"
    const workerName = worker?.name || "-"
    const contractType = contract.contractType || "ค่าแรง + ค่าวัสดุ"
    const total = Number(contract.totalAmount) || 0
    const installments = contract.installments || []
    const { scope, notes } = splitLegacyScope(contract.scope)
    const conditions = (contract.generalConditions || DEFAULT_GENERAL_CONDITIONS).trim()

    const handlePrint = () => {
        const html = generateContractHTML({
            contract,
            project,
            worker,
            org: orgProfile || { name: "บริษัท แบบบ้านสวย จำกัด" }
        })
        const printWindow = window.open("", "_blank")
        if (printWindow) {
            printWindow.document.write(html)
            printWindow.document.close()
            setTimeout(() => {
                printWindow.print()
            }, 400)
        } else {
            toast.error("กรุณาอนุญาต Popup เพื่อเปิดหน้าต่างพิมพ์")
        }
    }

    const handleSaveToDrive = async () => {
        if (!currentOrg) return
        try {
            setIsSavingToDrive(true)
            const toastId = toast.loading("กำลังเตรียมเอกสาร...")

            const { pdf } = await import("@react-pdf/renderer")
            const { ContractDocument } = await import("./contract-document")

            const blob = await pdf(
                <ContractDocument
                    contract={contract}
                    project={project}
                    worker={worker}
                    orgProfile={orgProfile as any}
                    settings={{} as any}
                    dictionary={{
                        contracts: {
                            document: {
                                title: contract.title || DEFAULT_CONTRACT_TITLE,
                                parties_title: "ข้อมูลคู่สัญญา",
                                employer: "ฝ่ายผู้ว่าจ้าง",
                                worker: "ฝ่ายผู้รับจ้าง",
                                project: "โครงการ",
                                duration: "ระยะเวลาสัญญา",
                                to: "ถึง",
                                tbd: "ตามตกลง",
                                scope_title: "ขอบเขตงาน",
                                schedule_title: "แผนการจ่ายเงินตามงวดงาน",
                                desc: "รายละเอียดงาน",
                                due_date: "กำหนดเสร็จ",
                                amount: "จำนวนเงิน",
                                total_value: "มูลค่างานรวม",
                                notes_title: "หมายเหตุ",
                                sign_employer: "ผู้ว่าจ้าง",
                                sign_worker: "ผู้รับจ้าง"
                            }
                        }
                    }}
                />
            ).toBlob()

            toast.loading("กำลังอัปโหลดไปยัง Google Drive...", { id: toastId })

            const base64String: string = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const result = reader.result as string
                    resolve(result.split(",")[1])
                }
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })

            const functions = getFunctions(undefined, "asia-southeast1")
            const uploadToDrive = httpsCallable(functions, "uploadToGoogleDrive")

            const dateObj = new Date(signDate || Date.now())
            const yearStr = (dateObj.getFullYear() + 543).toString()
            const monthStr = dateObj.toLocaleString("th-TH", { month: "long" })

            const folderPath = ["Contracts", project?.name || "General", yearStr, monthStr]
            const fileName = `สัญญาจ้าง_${docNo}_${project?.name || ""}_${worker?.name || ""}.pdf`.replace(/[:/\\?*]/g, "_")

            const response = await uploadToDrive({
                base64Data: base64String,
                fileName,
                mimeType: "application/pdf",
                orgId: currentOrg.id,
                folderPath
            })

            const result = response.data as any
            if (result.success) {
                toast.success("บันทึกสัญญาลง Google Drive เรียบร้อย!", { id: toastId })
            } else {
                toast.error(result.reason || "ไม่สามารถบันทึกได้", { id: toastId })
            }
        } catch (error) {
            console.error("Error saving contract to drive:", error)
            toast.error("เกิดข้อผิดพลาดในการบันทึก")
        } finally {
            setIsSavingToDrive(false)
        }
    }

    // Shared Header Block for pages
    const renderPageHeader = (pageNumber: number, titleText: string) => (
        <div className="pb-4 mb-4 border-b-2 border-neutral-900">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h2 className="text-base font-bold text-neutral-950 leading-tight">
                        {orgProfile?.name || "บริษัท แบบบ้านสวย จำกัด"}
                    </h2>
                    <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                        {orgProfile?.address || "94/67 หมู่ที่ 1 ตำบลเกาะขวาง อำเภอเมือง จังหวัดจันทบุรี 22000"}
                    </p>
                    {orgProfile?.phone && (
                        <p className="text-[11px] text-neutral-500 leading-tight">
                            โทร. {orgProfile.phone}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {orgProfile?.logo ? (
                        <img src={orgProfile.logo} alt="Company logo" className="h-8 max-w-[120px] object-contain" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                            {orgProfile?.name?.charAt(0) || "B"}
                        </div>
                    )}
                    <div className="border border-neutral-200 rounded px-2.5 py-1 text-[10px] text-neutral-600 bg-neutral-50/50">
                        <div className="flex justify-between gap-3">
                            <span className="text-neutral-500">เลขที่สัญญา:</span>
                            <span className="font-bold text-neutral-900">{docNo}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-neutral-500">วันที่ทำสัญญา:</span>
                            <span className="font-semibold text-neutral-900">{thDateLong(signDate)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-neutral-500">โครงการ:</span>
                            <span className="font-semibold text-neutral-900">{projectName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // Shared Signature Block
    const renderSignatures = () => (
        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-8 pt-6 border-t border-neutral-200 text-center text-[11px]">
            <div>
                <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                <div className="font-medium text-neutral-900">( {orgProfile?.signatureName || orgProfile?.name || "..................................................."} )</div>
                <div className="text-neutral-500 text-[10px] mt-0.5">ฝ่ายผู้ว่าจ้าง</div>
                <div className="text-neutral-400 text-[10px]">วันที่ ........ / ........ / ................</div>
            </div>
            <div>
                <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                <div className="font-medium text-neutral-900">( {workerName || "..................................................."} )</div>
                <div className="text-neutral-500 text-[10px] mt-0.5">ฝ่ายผู้รับจ้าง / ผู้แทนช่าง</div>
                <div className="text-neutral-400 text-[10px]">วันที่ ........ / ........ / ................</div>
            </div>
            <div>
                <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                <div className="font-medium text-neutral-900">( ................................................... )</div>
                <div className="text-neutral-500 text-[10px] mt-0.5">พยาน</div>
                <div className="text-neutral-400 text-[10px]">วันที่ ........ / ........ / ................</div>
            </div>
            <div>
                <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                <div className="font-medium text-neutral-900">( ................................................... )</div>
                <div className="text-neutral-500 text-[10px] mt-0.5">พยาน</div>
                <div className="text-neutral-400 text-[10px]">วันที่ ........ / ........ / ................</div>
            </div>
        </div>
    )

    return createPortal(
        <div className="fixed inset-0 z-[120] flex flex-col bg-neutral-950/90 backdrop-blur-md animate-in fade-in">
            {/* Top Toolbar */}
            <div className="h-16 px-4 sm:px-6 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-white shrink-0 z-20">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        สัญญาว่าจ้าง (3 หน้า A4)
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold truncate">
                            {docNo} - {contract.title || DEFAULT_CONTRACT_TITLE}
                        </h2>
                        <p className="text-xs text-neutral-400 truncate">
                            ผู้รับจ้าง: {workerName} · โครงการ: {projectName}
                        </p>
                    </div>
                </div>

                {/* Center / Right controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Zoom controls */}
                    <div className="flex items-center bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-700 text-xs">
                        <button
                            onClick={() => setZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
                            className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition"
                            title="ย่อ"
                            aria-label="ย่อ"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-12 text-center font-mono text-[11px] select-none text-neutral-300">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(z => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                            className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition"
                            title="ขยาย"
                            aria-label="ขยาย"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button
                        onClick={handleSaveToDrive}
                        disabled={isSavingToDrive}
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                    >
                        <UploadCloud className={`w-3.5 h-3.5 ${isSavingToDrive ? "animate-bounce" : ""}`} />
                        <span>{isSavingToDrive ? "กำลังบันทึก..." : "Drive"}</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>พิมพ์ / ดาวน์โหลด PDF</span>
                    </button>

                    <button
                        onClick={() => {
                            onClose()
                            onEdit()
                        }}
                        className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
                        title="แก้ไขสัญญา"
                        aria-label="แก้ไขสัญญา"
                    >
                        <Edit className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
                        title="ปิด"
                        aria-label="ปิด"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sub-header: Current Page indicator */}
            <div className="bg-neutral-900/60 border-b border-neutral-800/80 px-4 py-1.5 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-4">
                <span>หน้า 1 / 3 (สัญญาว่าจ้าง)</span>
                <span>•</span>
                <span>หน้า 2 / 3 (เอกสารแนบท้าย 1: แผนงาน)</span>
                <span>•</span>
                <span>หน้า 3 / 3 (เอกสารแนบท้าย 2: เงื่อนไขและการยกเลิกสัญญา)</span>
            </div>

            {/* Scrollable Document Canvas */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex flex-col items-center gap-8 bg-neutral-950/60"
            >
                {/* ──────────────────────────────────────────────── PAGE 1 ──────────────────────────────────────────────── */}
                <div
                    style={{
                        width: "210mm",
                        minHeight: "297mm",
                        transform: `scale(${zoom})`,
                        transformOrigin: "top center",
                        marginBottom: `calc((297mm * ${zoom}) - 297mm)`
                    }}
                    className="bg-white text-neutral-900 shadow-2xl rounded-sm p-[14mm] text-[12px] leading-relaxed relative flex flex-col justify-between shrink-0 font-['Sarabun',sans-serif]"
                >
                    <div>
                        {renderPageHeader(1, "สัญญาว่าจ้างเหมางาน")}

                        <div className="text-center my-3">
                            <h1 className="text-lg font-bold text-neutral-950 tracking-wide">
                                สัญญาว่าจ้างเหมางาน
                            </h1>
                            <p className="text-[10px] text-neutral-500 font-medium">
                                (SUBCONTRACTOR AGREEMENT)
                            </p>
                        </div>

                        {/* ข้อมูลคู่สัญญา */}
                        <div className="mb-3">
                            <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-sm border-l-4 border-emerald-600 mb-2">
                                ข้อมูลคู่สัญญา (Parties to Agreement)
                            </div>
                            <div className="grid grid-cols-2 gap-4 border border-neutral-200 rounded p-2.5 text-[11px]">
                                <div>
                                    <div className="text-emerald-700 font-semibold mb-1">ฝ่ายผู้ว่าจ้าง (บริษัทฯ)</div>
                                    <div className="font-bold text-neutral-950">{orgProfile?.name || "บริษัท แบบบ้านสวย จำกัด"}</div>
                                    <div className="text-neutral-600 text-[10px] leading-tight mt-0.5">
                                        สำนักงาน: {orgProfile?.address || "94/67 หมู่ 1 ต.เกาะขวาง อ.เมือง จ.จันทบุรี 22000"}
                                    </div>
                                    {orgProfile?.phone && (
                                        <div className="text-neutral-600 text-[10px]">โทรศัพท์: {orgProfile.phone}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-emerald-700 font-semibold mb-1">ฝ่ายผู้รับจ้าง / ผู้แทนช่าง (ช่าง)</div>
                                    <div className="font-bold text-neutral-950">{workerName}</div>
                                    <div className="text-neutral-600 text-[10px] leading-tight mt-0.5">
                                        ข้อมูลวิชาชีพ: {worker?.role || "ช่างรับเหมา"} · ประเภท: {contractType}
                                    </div>
                                    {worker?.phone && (
                                        <div className="text-neutral-600 text-[10px]">โทรศัพท์: {worker.phone}</div>
                                    )}
                                    <div className="text-neutral-600 text-[10px] leading-tight">
                                        สถานที่ปฏิบัติงาน: โครงการ {projectName} {project?.location ? `(${project.location})` : ""}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* สาระสำคัญและข้อตกลงแห่งสัญญา */}
                        <div>
                            <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-sm border-l-4 border-emerald-600 mb-2">
                                สาระสำคัญและข้อตกลงแห่งสัญญา (Terms & Conditions)
                            </div>
                            <div className="border border-neutral-200 rounded p-3 text-[11px] space-y-2 text-neutral-800">
                                <div>
                                    <span className="font-bold text-neutral-950">ข้อ 1. วัตถุประสงค์แห่งการจ้างเหมา:</span>
                                    <p className="text-neutral-700 text-[10.5px] leading-normal pl-3">
                                        ผู้ว่าจ้างตกลงจ้างและผู้รับจ้างตกลงรับจ้างทำงาน <b>{contractType}</b> ณ สถานที่ก่อสร้าง โครงการ <b>{projectName}</b> ตามแบบแปลน รายการประกอบแบบ และคำแนะนำของวิศวกรหรือผู้ควบคุมงานของผู้ว่าจ้าง
                                    </p>
                                </div>

                                <div>
                                    <span className="font-bold text-neutral-950">ข้อ 2. สิ่งที่รวมในสัญญา (Inclusions):</span>
                                    <p className="text-neutral-700 text-[10.5px] leading-normal pl-3 whitespace-pre-wrap">
                                        {scope || contract.inclusions || "งานติดตั้งตามแบบแปลนและรายการประกอบแบบ"}
                                    </p>
                                </div>

                                <div>
                                    <span className="font-bold text-neutral-950">ข้อ 3. สิ่งที่ไม่รวมในสัญญา (Exclusions):</span>
                                    <p className="text-neutral-700 text-[10.5px] leading-normal pl-3 whitespace-pre-wrap">
                                        {contract.exclusions || "งานปูกระเบื้องพื้นทางขึ้น และงานอื่นๆ ที่มิได้ระบุในสัญญา"}
                                    </p>
                                </div>

                                <div>
                                    <span className="font-bold text-neutral-950">ข้อ 4. มูลค่าว่าจ้างตามสัญญา:</span>
                                    <p className="text-neutral-700 text-[10.5px] leading-normal pl-3">
                                        ทั้งสองฝ่ายตกลงค่าจ้างเหมางานตามสัญญานี้ เป็นจำนวนเงินทั้งสิ้น{" "}
                                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                            {fmtNum(total)} บาท
                                        </span>{" "}
                                        ({bahtText(total)})
                                    </p>
                                </div>

                                <div>
                                    <span className="font-bold text-neutral-950">ข้อ 5. เงื่อนไขการตรวจรับและชำระเงินค่างวดงาน:</span>
                                    <p className="text-neutral-700 text-[10.5px] leading-normal pl-3">
                                        ชำระเงินตามงวดงานที่กำหนด ภายหลังการตรวจรับงานถูกต้องครบถ้วน โดยแบ่งการจ่ายเงินออกเป็น <b>{installments.length} งวดงาน</b> ตามรายละเอียดที่ระบุไว้ใน "เอกสารแนบท้ายสัญญา 1: แผนการส่งมอบงานและการจ่ายเงินตามงวดงาน"
                                    </p>
                                </div>

                                <div>
                                    <span className="font-bold text-neutral-950">ข้อ 6. การรับประกันผลงาน:</span>
                                    <p className="text-neutral-700 text-[10.5px] leading-normal pl-3">
                                        {contract.warranty || DEFAULT_WARRANTY}
                                    </p>
                                </div>

                                <div>
                                    <span className="font-bold text-neutral-950">ข้อ 7. เงื่อนไข ข้อตกลงทั่วไป และการบอกเลิกสัญญา:</span>
                                    <p className="text-neutral-700 text-[10.5px] leading-normal pl-3">
                                        ทั้งสองฝ่ายตกลงผูกพันและปฏิบัติตามมาตรฐานฝีมือช่าง ความปลอดภัย การควบคุมงาน และสิทธิการบอกเลิกสัญญาตามรายละเอียดที่ระบุไว้ใน "เอกสารแนบท้ายสัญญา 2: เงื่อนไข ข้อตกลง และการบอกเลิกสัญญาจ้างเหมางาน" ซึ่งถือเป็นส่วนหนึ่งของสัญญานี้
                                    </p>
                                </div>

                                {notes && (
                                    <div className="pt-1 border-t border-dashed border-neutral-200">
                                        <span className="font-bold text-neutral-950">หมายเหตุ:</span>
                                        <p className="text-neutral-700 text-[10.5px] pl-3 whitespace-pre-wrap">{notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {renderSignatures()}
                </div>

                {/* ──────────────────────────────────────────────── PAGE 2 ──────────────────────────────────────────────── */}
                <div
                    style={{
                        width: "210mm",
                        minHeight: "297mm",
                        transform: `scale(${zoom})`,
                        transformOrigin: "top center",
                        marginBottom: `calc((297mm * ${zoom}) - 297mm)`
                    }}
                    className="bg-white text-neutral-900 shadow-2xl rounded-sm p-[14mm] text-[12px] leading-relaxed relative flex flex-col justify-between shrink-0 font-['Sarabun',sans-serif]"
                >
                    <div>
                        {renderPageHeader(2, "เอกสารแนบท้ายสัญญา 1: แผนการส่งมอบงานและการจ่ายเงินตามงวดงาน")}

                        <div className="text-center my-3">
                            <h2 className="text-base font-bold text-neutral-950">
                                เอกสารแนบท้ายสัญญา 1: แผนการส่งมอบงานและการจ่ายเงินตามงวดงาน
                            </h2>
                            <p className="text-[10px] text-neutral-500 font-medium">
                                (ANNEX 1: MILESTONE PAYMENT SCHEDULE & DELIVERABLES)
                            </p>
                        </div>

                        {/* Milestone Table */}
                        <div className="border border-neutral-300 rounded overflow-hidden mt-4">
                            <table className="w-full text-left text-[11px] border-collapse">
                                <thead>
                                    <tr className="bg-neutral-100/90 text-neutral-800 border-b border-neutral-300 font-bold">
                                        <th className="py-2.5 px-3 text-center w-12 border-r border-neutral-300">งวดที่</th>
                                        <th className="py-2.5 px-3 border-r border-neutral-300">รายละเอียดงานที่ต้องส่งมอบ (Deliverables)</th>
                                        <th className="py-2.5 px-3 text-center w-28 border-r border-neutral-300">กำหนดเสร็จ</th>
                                        <th className="py-2.5 px-3 text-center w-16 border-r border-neutral-300">สัดส่วน</th>
                                        <th className="py-2.5 px-3 text-right w-28">จำนวนเงิน (บาท)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    {installments.map((inst, idx) => {
                                        const pct = total > 0 ? Math.round((inst.amount / total) * 1000) / 10 : 0
                                        return (
                                            <tr key={inst.id || idx} className="hover:bg-neutral-50/50">
                                                <td className="py-2.5 px-3 text-center font-bold text-neutral-800 border-r border-neutral-200">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 border-r border-neutral-200 leading-normal">
                                                    <div className="font-semibold text-neutral-950">{inst.description}</div>
                                                    {inst.details && (
                                                        <div className="text-[10px] text-neutral-600 mt-0.5 whitespace-pre-wrap">
                                                            {inst.details}
                                                        </div>
                                                    )}
                                                    {inst.paymentDetails && (
                                                        <div className="text-[10px] text-emerald-800 bg-emerald-50/70 p-1 rounded mt-1 whitespace-pre-wrap">
                                                            <b>เงื่อนไขจ่าย:</b> {inst.paymentDetails}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-neutral-600 border-r border-neutral-200 text-[10px]">
                                                    {inst.dueDate ? thDateLong(inst.dueDate) : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-neutral-700 font-medium border-r border-neutral-200">
                                                    {pct}%
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-neutral-950 tabular-nums">
                                                    ฿{fmtNum(inst.amount)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-emerald-500">
                                        <td colSpan={3} className="py-2.5 px-3 text-right border-r border-emerald-300">
                                            รวมมูลค่างานจ้างทั้งสิ้นตามสัญญา ({bahtText(total)}):
                                        </td>
                                        <td className="py-2.5 px-3 text-center border-r border-emerald-300">100%</td>
                                        <td className="py-2.5 px-3 text-right tabular-nums text-sm">
                                            ฿{fmtNum(total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="mt-4 p-2.5 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-neutral-600 space-y-1">
                            <p><b>หมายเหตุการเบิกจ่ายงวดงาน:</b></p>
                            <p>• การจ่ายเงินในแต่ละงวดจะเกิดขึ้นหลังจากผู้รับจ้างได้ส่งมอบงานและได้รับการตรวจรับจากผู้ควบคุมงานของผู้ว่าจ้างเรียบร้อยแล้ว</p>
                            <p>• ผู้ว่าจ้างอาจพิจารณาอนุมัติให้เบิกจ่ายเงินระหว่างงวด (เช่น งวดที่ 5.1, 5.2) ได้ตามสัดส่วนความก้าวหน้าของงานจริงที่เกิดขึ้นหน้างาน โดยยอดรวมของการเบิกย่อยต้องไม่เกินจำนวนเงินของงวดนั้นๆ</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 mt-8 pt-4 border-t border-neutral-200 text-center text-[11px]">
                        <div>
                            <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                            <div className="font-medium text-neutral-900">( {orgProfile?.signatureName || orgProfile?.name || "..................................................."} )</div>
                            <div className="text-neutral-500 text-[10px]">ผู้ว่าจ้าง</div>
                        </div>
                        <div>
                            <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                            <div className="font-medium text-neutral-900">( {workerName || "..................................................."} )</div>
                            <div className="text-neutral-500 text-[10px]">ผู้รับจ้าง</div>
                        </div>
                    </div>
                </div>

                {/* ──────────────────────────────────────────────── PAGE 3 ──────────────────────────────────────────────── */}
                <div
                    style={{
                        width: "210mm",
                        minHeight: "297mm",
                        transform: `scale(${zoom})`,
                        transformOrigin: "top center",
                        marginBottom: `calc((297mm * ${zoom}) - 297mm)`
                    }}
                    className="bg-white text-neutral-900 shadow-2xl rounded-sm p-[14mm] text-[12px] leading-relaxed relative flex flex-col justify-between shrink-0 font-['Sarabun',sans-serif]"
                >
                    <div>
                        {renderPageHeader(3, "เอกสารแนบท้ายสัญญา 2: เงื่อนไข ข้อตกลง และการยกเลิกสัญญาจ้างเหมางาน")}

                        <div className="text-center my-3">
                            <h2 className="text-base font-bold text-neutral-950">
                                เอกสารแนบท้ายสัญญา 2: เงื่อนไข ข้อตกลง และการยกเลิกสัญญาจ้างเหมางาน
                            </h2>
                            <p className="text-[10px] text-neutral-500 font-medium">
                                (ANNEX 2: GENERAL CONDITIONS, WORK QUALITY, SAFETY & CONTRACT TERMINATION)
                            </p>
                        </div>

                        <div className="border border-neutral-200 rounded p-3 text-[11px] space-y-2.5 text-neutral-800 mt-4 leading-normal">
                            {conditions.split("\n").map((line, idx) => {
                                const trimmed = line.trim()
                                if (!trimmed) return null
                                const isHeader = /^\d+\./.test(trimmed)
                                if (isHeader) {
                                    return (
                                        <div key={idx} className="font-bold text-neutral-950 mt-2 first:mt-0">
                                            {trimmed}
                                        </div>
                                    )
                                }
                                return (
                                    <p key={idx} className="text-neutral-700 text-[10.5px] pl-3 leading-normal">
                                        {trimmed}
                                    </p>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 mt-8 pt-6 border-t border-neutral-200 text-center text-[11px]">
                        <div>
                            <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                            <div className="font-medium text-neutral-900">( {orgProfile?.signatureName || orgProfile?.name || "..................................................."} )</div>
                            <div className="text-neutral-500 text-[10px] mt-0.5">ฝ่ายผู้ว่าจ้าง</div>
                            <div className="text-neutral-400 text-[10px]">วันที่ ........ / ........ / ................</div>
                        </div>
                        <div>
                            <div className="border-b border-dotted border-neutral-400 h-8 mx-6 mb-1"></div>
                            <div className="font-medium text-neutral-900">( {workerName || "..................................................."} )</div>
                            <div className="text-neutral-500 text-[10px] mt-0.5">ฝ่ายผู้รับจ้าง / ผู้แทนช่าง</div>
                            <div className="text-neutral-400 text-[10px]">วันที่ ........ / ........ / ................</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
