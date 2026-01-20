"use client"

import { useSettings } from "@/context/settings-context"
import { useNotifications } from "@/context/notification-context"
import { Bell, Calendar, Clock, AlertTriangle, Smartphone } from "lucide-react"
import { MoodSettings } from "./mood-settings"
import { FinancialTargetSettings } from "./financial-target-settings"

import { useTranslation } from "@/lib/i18n-context"
export function NotificationSettings() {
    const { t } = useTranslation()
    const { notificationSettings, updateNotificationSettings } = useSettings()
    const { requestPushPermission, permissionStatus, isPushEnabled } = useNotifications()

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.settings.notifications.title}</h3>
                <div className="bg-muted/30 p-4 rounded-xl border border-white/5 space-y-4">

                    {/* Warning Days */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            {t.settings.notifications.warning_days}
                        </label>
                        <p className="text-xs text-muted-foreground">{t.settings.notifications.warning_desc}</p>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="14"
                                step="1"
                                value={notificationSettings.warnDaysBeforeDue}
                                onChange={(e) => updateNotificationSettings({ warnDaysBeforeDue: parseInt(e.target.value) })}
                                className="flex-1 accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="w-12 h-10 rounded-lg bg-background border border-white/10 flex items-center justify-center font-bold font-mono">
                                {notificationSettings.warnDaysBeforeDue}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border my-4" />

                    {/* Push Notifications */}
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

                    <div className="h-px bg-border my-4" />

                    {/* Toggles */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    {t.settings.notifications.overdue}
                                </label>
                                <p className="text-xs text-muted-foreground">{t.settings.notifications.overdue_desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.notifyOnOverdue}
                                    onChange={(e) => updateNotificationSettings({ notifyOnOverdue: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-blue-500" />
                                    {t.settings.notifications.assignments}
                                </label>
                                <p className="text-xs text-muted-foreground">{t.settings.notifications.assignments_desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.notifyOnTaskAssignment}
                                    onChange={(e) => updateNotificationSettings({ notifyOnTaskAssignment: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
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
