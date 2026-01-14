"use client"

import { useSettings } from "@/context/settings-context"
import { Bell, Calendar, Clock, AlertTriangle } from "lucide-react"

export function NotificationSettings() {
    const { notificationSettings, updateNotificationSettings } = useSettings()

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alert Preferences</h3>
                <div className="bg-muted/30 p-4 rounded-xl border border-white/5 space-y-4">

                    {/* Warning Days */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Advance Warning (Days)
                        </label>
                        <p className="text-xs text-muted-foreground">How many days in advance should we alert you about due dates?</p>
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

                    {/* Toggles */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    Overdue Alerts
                                </label>
                                <p className="text-xs text-muted-foreground">Get notified immediately when items are overdue.</p>
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
                                    Task Assignments
                                </label>
                                <p className="text-xs text-muted-foreground">Get notified when you are assigned to a new task.</p>
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
        </div>
    )
}
