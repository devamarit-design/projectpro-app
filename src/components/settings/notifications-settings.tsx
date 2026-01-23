import { useState, useEffect } from "react"
import { useSettings, NotificationSettings as NotificationSettingsType } from "@/context/settings-context"
import { useNotifications } from "@/context/notification-context"
import { useProjects } from "@/context/project-context"
import { Bell, Calendar, Clock, AlertTriangle, Smartphone, Save, Loader2 } from "lucide-react"
import { MoodSettings } from "./mood-settings"
import { FinancialTargetSettings } from "./financial-target-settings"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { useTranslation } from "@/lib/i18n-context"
export function NotificationSettings() {
    const { t } = useTranslation()
    const { notificationSettings, updateNotificationSettings } = useSettings()
    const { requestPushPermission, permissionStatus, isPushEnabled } = useNotifications()
    const { currentUser } = useProjects()

    const canEdit = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'

    // Local state for manual save
    const [localSettings, setLocalSettings] = useState<NotificationSettingsType>(notificationSettings)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Sync local state when context changes (initial load or external update)
    // Only sync if NOT dirty to avoid overwriting user's unsaved changes? 
    // Or strictly sync? Let's sync but checking equality might be safer.
    // For simplicity, we sync on mount or if context changes significantly, but we want to avoid overwriting ongoing edits.
    // Let's rely on initial state and context updates.
    useEffect(() => {
        setLocalSettings(notificationSettings)
        setHasChanges(false)
    }, [notificationSettings])

    const handleSettingChange = (updates: Partial<NotificationSettingsType>) => {
        setLocalSettings(prev => {
            const next = { ...prev, ...updates }
            // Check if changed from original
            const isDifferent = JSON.stringify(next) !== JSON.stringify(notificationSettings)
            setHasChanges(isDifferent)
            return next
        })
    }

    const handleSave = async () => {
        if (!canEdit) return
        setIsSaving(true)
        try {
            await updateNotificationSettings(localSettings)
            toast.success("Notification settings saved")
            setHasChanges(false)
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t.settings.notifications.title}</h3>
                    {canEdit && (
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            size="sm"
                            className="gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </Button>
                    )}
                </div>

                <div className="bg-muted/30 p-6 rounded-xl border border-white/5 space-y-8">

                    {/* Warning Days - Tasks */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                {t.settings.notifications?.warning_days_task || "Task Advance Warning (Days)"}
                            </label>
                            <span className="text-sm font-mono bg-background border border-white/10 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                {localSettings.warnDaysTasks || 3}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.settings.notifications.warning_desc}</p>
                        <input
                            type="range"
                            min="1"
                            max="14"
                            step="1"
                            disabled={!canEdit}
                            value={localSettings.warnDaysTasks || 3}
                            onChange={(e) => handleSettingChange({ warnDaysTasks: parseInt(e.target.value) })}
                            className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Warning Days - Expenses */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4 text-rose-500" />
                                {t.settings.notifications?.warning_days_expense || "Expense Advance Warning (Days)"}
                            </label>
                            <span className="text-sm font-mono bg-background border border-white/10 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                {localSettings.warnDaysExpenses || 7}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.settings.notifications.warning_desc}</p>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            disabled={!canEdit}
                            value={localSettings.warnDaysExpenses || 7}
                            onChange={(e) => handleSettingChange({ warnDaysExpenses: parseInt(e.target.value) })}
                            className="w-full accent-rose-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Push Notifications - Local Setting */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-purple-500" />
                                {t.settings.notifications?.push_title || "Push Notifications"}
                            </label>
                            <p className="text-xs text-muted-foreground">{t.settings.notifications?.push_desc || "Receive notifications on this device"}</p>
                        </div>
                        {permissionStatus === 'denied' ? (
                            <div className="px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-medium rounded-lg border border-red-500/20">
                                Blocked
                            </div>
                        ) : (
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPushEnabled}
                                    onChange={requestPushPermission}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        )}
                    </div>

                    {/* Overdue Notification - Org Setting */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                {t.settings.notifications.overdue}
                            </label>
                            <p className="text-xs text-muted-foreground">{t.settings.notifications.overdue_desc}</p>
                        </div>
                        <label className={`relative inline-flex items-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                            <input
                                type="checkbox"
                                disabled={!canEdit}
                                checked={localSettings.notifyOnOverdue}
                                onChange={(e) => handleSettingChange({ notifyOnOverdue: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Task Assignment - Org Setting */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Bell className="w-4 h-4 text-blue-500" />
                                {t.settings.notifications.assignments}
                            </label>
                            <p className="text-xs text-muted-foreground">{t.settings.notifications.assignments_desc}</p>
                        </div>
                        <label className={`relative inline-flex items-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                            <input
                                type="checkbox"
                                disabled={!canEdit}
                                checked={localSettings.notifyOnTaskAssignment}
                                onChange={(e) => handleSettingChange({ notifyOnTaskAssignment: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border my-8" />
            <div className="h-px bg-border my-8" />
            <MoodSettings />
            <FinancialTargetSettings />
        </div>
    )
}
