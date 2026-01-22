"use client"

import { useState, useEffect } from "react"
import { useSettings, TelegramSettings as TelegramSettingsType } from "@/context/settings-context"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { useTranslation } from "@/lib/i18n-context"
import { testTelegramConnection } from "@/lib/functions-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Send,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Loader2,
    Info,
    Eye,
    EyeOff,
    MessageCircle,
    Bell,
    Calendar,
    FileText
} from "lucide-react"
import { toast } from "sonner"

export function TelegramSettings() {
    const { t } = useTranslation()
    const { currentUser } = useProjects()
    const { currentOrg } = useOrganization()
    const { telegramSettings, updateTelegramSettings } = useSettings()

    const [localSettings, setLocalSettings] = useState<TelegramSettingsType>({
        enabled: false,
        botToken: "",
        chatId: "",
        notifyOnExpense: true,
        notifyOnQuotation: true,
        notifyOnPaymentDue: true,
        paymentDueDays: 3
    })
    const [showToken, setShowToken] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Load settings when component mounts or telegramSettings changes
    useEffect(() => {
        if (telegramSettings) {
            setLocalSettings(telegramSettings)
        }
    }, [telegramSettings])

    // Check if user is owner
    const isOwner = currentUser?.role === 'Owner'

    if (!isOwner) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground max-w-md">
                    Only Organization Owners can configure Telegram notifications.
                </p>
            </div>
        )
    }

    const handleTestConnection = async () => {
        if (!localSettings.botToken || !localSettings.chatId) {
            toast.error(t.settings.telegram.config_desc)
            return
        }

        if (!currentOrg?.id) {
            toast.error("Organization ID not found")
            return
        }

        setIsTesting(true)
        setTestResult(null)

        try {
            const result = await testTelegramConnection({
                orgId: currentOrg.id,
                botToken: localSettings.botToken,
                chatId: localSettings.chatId
            })

            if (result.success) {
                setTestResult({ success: true, message: t.settings.telegram.test_success })
                toast.success(t.settings.telegram.test_success)
            } else {
                const errorMsg = result.error || "Connection failed"
                setTestResult({ success: false, message: errorMsg })
                toast.error(errorMsg)
            }
        } catch (error) {
            setTestResult({ success: false, message: "Error testing connection" })
            toast.error("Error testing connection")
        } finally {
            setIsTesting(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateTelegramSettings(localSettings)
            toast.success(t.settings.telegram.save_success)
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Send className="w-6 h-6" />
                    {t.settings.telegram.title}
                </h2>
                <p className="text-muted-foreground mt-1">
                    {t.settings.telegram.subtitle}
                </p>
            </div>

            {/* Setup Instructions */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{t.settings.telegram.setup_guide}</AlertTitle>
                <AlertDescription className="mt-3 space-y-2">
                    <ol className="list-decimal list-inside space-y-1.5 text-sm">
                        <li>{t.settings.telegram.setup_step1}</li>
                        <li>{t.settings.telegram.setup_step2}</li>
                        <li>{t.settings.telegram.setup_step3}</li>
                        <li>{t.settings.telegram.setup_step4}</li>
                        <li>{t.settings.telegram.setup_step5}</li>
                    </ol>
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="gap-1" asChild>
                            <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                                {t.settings.telegram.open_botfather}
                            </a>
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" asChild>
                            <a href="https://t.me/RawDataBot" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                                {t.settings.telegram.find_chatid}
                            </a>
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>

            {/* Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{t.settings.telegram.config_title}</span>
                        <Switch
                            checked={localSettings.enabled}
                            onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enabled: checked }))}
                        />
                    </CardTitle>
                    <CardDescription>
                        {localSettings.enabled ? "Notifications Enabled" : "Notifications Disabled"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Bot Token */}
                    <div className="space-y-2">
                        <Label htmlFor="botToken">{t.settings.telegram.bot_token}</Label>
                        <div className="relative">
                            <Input
                                id="botToken"
                                type={showToken ? "text" : "password"}
                                placeholder="123456789:ABCdefGHIjklMNO..."
                                value={localSettings.botToken}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, botToken: e.target.value }))}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowToken(!showToken)}
                            >
                                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Chat ID */}
                    <div className="space-y-2">
                        <Label htmlFor="chatId">{t.settings.telegram.chat_id}</Label>
                        <Input
                            id="chatId"
                            placeholder="-1001234567890"
                            value={localSettings.chatId}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, chatId: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t.settings.telegram.chat_id_hint}
                        </p>
                    </div>

                    {/* Test Connection Button */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={isTesting || !localSettings.botToken || !localSettings.chatId}
                            className="gap-2"
                        >
                            {isTesting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Bell className="w-4 h-4" />
                            )}
                            {t.settings.telegram.test_conn}
                        </Button>

                        {testResult && (
                            <div className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                {testResult.success ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                {testResult.message}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.telegram.types_title}</CardTitle>
                    <CardDescription>{t.settings.telegram.types_desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Expense Notification */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                {t.settings.telegram.notify_expense}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t.settings.telegram.notify_expense_desc}
                            </p>
                        </div>
                        <Switch
                            checked={localSettings.notifyOnExpense}
                            onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, notifyOnExpense: checked }))}
                        />
                    </div>

                    <hr className="border-border" />

                    {/* Quotation Notification */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {t.settings.telegram.notify_quotation}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t.settings.telegram.notify_quotation_desc}
                            </p>
                        </div>
                        <Switch
                            checked={localSettings.notifyOnQuotation}
                            onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, notifyOnQuotation: checked }))}
                        />
                    </div>

                    <hr className="border-border" />

                    {/* Payment Due Notification */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {t.settings.telegram.notify_payment}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t.settings.telegram.notify_payment_desc}
                            </p>
                        </div>
                        <Switch
                            checked={localSettings.notifyOnPaymentDue}
                            onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, notifyOnPaymentDue: checked }))}
                        />
                    </div>

                    {/* Payment Due Days */}
                    {localSettings.notifyOnPaymentDue && (
                        <div className="ml-6 space-y-2">
                            <Label htmlFor="paymentDueDays">{t.settings.telegram.days_advance}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="paymentDueDays"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={localSettings.paymentDueDays}
                                    onChange={(e) => setLocalSettings(prev => ({
                                        ...prev,
                                        paymentDueDays: Math.max(1, Math.min(30, parseInt(e.target.value) || 3))
                                    }))}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">Days (1-30)</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                    {t.settings.telegram.save_btn}
                </Button>
            </div>
        </div>
    )
}
