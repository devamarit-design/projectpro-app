"use client"

import * as React from "react"
import { Calendar, User, ShoppingBag, Plus, Trash2, ChevronDown, ChevronRight, Save, Download, FileCheck } from "lucide-react"

type ItemType = "standard" | "parent" | "sub"

interface DocumentItem {
    id: string
    type: ItemType
    description: string
    quantity: number
    unitPrice: number
    parentId?: string
    subItems?: DocumentItem[]
    expanded?: boolean
}

export function DocumentCreatorForm() {
    const [items, setItems] = React.useState<DocumentItem[]>([
        { id: "1", type: "standard", description: "Consultation Fee", quantity: 1, unitPrice: 5000 },
    ])

    const calculateTotal = (item: DocumentItem): number => {
        if (item.type === "parent" && item.subItems) {
            return item.subItems.reduce((sum, sub) => sum + (sub.quantity * sub.unitPrice), 0)
        }
        return item.quantity * item.unitPrice
    }

    const grandTotal = items.reduce((sum, item) => sum + calculateTotal(item), 0)

    const addItem = (type: "standard" | "parent") => {
        const newItem: DocumentItem = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            description: type === "parent" ? "New Section Group" : "New Item",
            quantity: 1,
            unitPrice: 0,
            subItems: type === "parent" ? [] : undefined,
            expanded: true
        }
        setItems([...items, newItem])
    }

    const addSubItem = (parentId: string) => {
        const newItem: DocumentItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: "sub",
            description: "Sub-item Detail",
            quantity: 1,
            unitPrice: 0,
            parentId
        }
        setItems(items.map(item => {
            if (item.id === parentId) {
                return { ...item, subItems: [...(item.subItems || []), newItem] }
            }
            return item
        }))
    }

    const toggleExpand = (id: string) => {
        setItems(items.map(item => item.id === id ? { ...item, expanded: !item.expanded } : item))
    }

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id))
    }

    const deleteSubItem = (parentId: string, subId: string) => {
        setItems(items.map(item => {
            if (item.id === parentId && item.subItems) {
                return { ...item, subItems: item.subItems.filter(sub => sub.id !== subId) }
            }
            return item
        }))
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">New Quotation</h1>
                    <p className="text-muted-foreground mt-1">Create a new document for your client.</p>
                </div>
                <div className="flex bg-muted rounded-lg p-1">
                    <button className="px-4 py-1.5 bg-background shadow-sm rounded-md text-sm font-medium">Quotation</button>
                    <button className="px-4 py-1.5 text-muted-foreground text-sm font-medium hover:text-foreground">Invoice</button>
                    <button className="px-4 py-1.5 text-muted-foreground text-sm font-medium hover:text-foreground">Receipt</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Client & Project Info */}
                <div className="md:col-span-2 space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" /> Client Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1">
                                <option>Select Client...</option>
                                <option>K. Somsak</option>
                                <option>ABC Corp</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Project</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1">
                                <option>Select Project...</option>
                                <option>Modern Loft Renovation</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Service Tags</label>
                            <input type="text" placeholder="e.g. Renovation, Design, Interior" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1" />
                        </div>
                    </div>
                </div>

                {/* Document Meta */}
                <div className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" /> Document Info
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                            <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                            <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Document No.</label>
                            <input type="text" value="QT-2024003" readOnly className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm mt-1 text-muted-foreground font-mono" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Item Entry System */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" /> Items
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => addItem('standard')} className="text-xs flex items-center gap-1 bg-white border border-border px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                        <button onClick={() => addItem('parent')} className="text-xs flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity">
                            <Plus className="w-3 h-3" /> Add Group System
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted text-muted-foreground text-left">
                            <tr>
                                <th className="px-4 py-3 w-10"></th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 w-24 text-center">Qty</th>
                                <th className="px-4 py-3 w-32 text-right">Unit Price</th>
                                <th className="px-4 py-3 w-32 text-right">Total</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item) => (
                                <React.Fragment key={item.id}>
                                    {/* Parent/Standard Row */}
                                    <tr className={`group ${item.type === 'parent' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            {item.type === 'parent' && (
                                                <button onClick={() => toggleExpand(item.id)}>
                                                    {item.expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                defaultValue={item.description}
                                                className={`w-full bg-transparent border-none focus:ring-0 p-0 font-medium ${item.type === 'parent' ? 'text-primary' : ''}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.type !== 'parent' && (
                                                <input type="number" defaultValue={item.quantity} className="w-full bg-transparent border-b border-border focus:border-primary text-center p-1" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {item.type !== 'parent' && (
                                                <input type="number" defaultValue={item.unitPrice} className="w-full bg-transparent border-b border-border focus:border-primary text-right p-1" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">
                                            {calculateTotal(item).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Sub Items */}
                                    {item.type === 'parent' && item.expanded && item.subItems?.map((sub) => (
                                        <tr key={sub.id} className="bg-muted/10 group">
                                            <td className="px-4 py-2 border-r border-border/50"></td>
                                            <td className="px-4 py-2 pl-8 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
                                                <input type="text" defaultValue={sub.description} className="w-full bg-transparent border-none focus:ring-0 p-0 text-muted-foreground text-xs" />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <input type="number" defaultValue={sub.quantity} className="w-full bg-transparent border-b border-border/50 focus:border-primary text-center p-1 text-xs" />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <input type="number" defaultValue={sub.unitPrice} className="w-full bg-transparent border-b border-border/50 focus:border-primary text-right p-1 text-xs" />
                                            </td>
                                            <td className="px-4 py-2 text-right text-muted-foreground text-xs">
                                                {(sub.quantity * sub.unitPrice).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => deleteSubItem(item.id, sub.id)} className="text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Add Sub Item Button */}
                                    {item.type === 'parent' && item.expanded && (
                                        <tr className="bg-muted/5">
                                            <td className="border-r border-border/50"></td>
                                            <td colSpan={5} className="px-4 py-2">
                                                <button onClick={() => addSubItem(item.id)} className="text-xs text-primary hover:underline flex items-center gap-1 ml-6">
                                                    <Plus className="w-3 h-3" /> Add Item to Group
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className="bg-muted/50 font-bold">
                            <tr>
                                <td colSpan={4} className="px-4 py-4 text-right">Total Amount (THB)</td>
                                <td className="px-4 py-4 text-right text-lg text-primary">{grandTotal.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 shadow-lg z-40 md:pl-64 transition-all duration-300">
                <div className="max-w-5xl mx-auto flex justify-end gap-3">
                    <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted bg-background">
                        Preview
                    </button>
                    <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted bg-background flex items-center gap-2">
                        <Download className="w-4 h-4" /> Save Draft
                    </button>
                    <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20">
                        <FileCheck className="w-4 h-4" /> Approve & Issue
                    </button>
                </div>
            </div>
        </div>
    )
}
