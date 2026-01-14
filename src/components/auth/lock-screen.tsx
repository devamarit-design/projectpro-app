"use client"

import { useState, useEffect } from "react"
import { useSecurity } from "@/context/security-context"
import { Lock, Unlock, Delete } from "lucide-react"

export function LockScreen() {
    const { unlockApp, isLocked, isLoading, hasPin } = useSecurity()
    const [pin, setPin] = useState("")
    const [error, setError] = useState(false)
    const [success, setSuccess] = useState(false)

    // Clear PIN if screen unlocks
    useEffect(() => {
        if (!isLocked) {
            setPin("")
            setSuccess(false)
        }
    }, [isLocked])

    const handleNumberClick = (num: number) => {
        if (pin.length < 6) {
            const newPin = pin + num
            setPin(newPin)
            if (newPin.length >= 4) { // Auto-submit on 4-6 digits? Let's wait for 6 or user intent? 
                // Let's assume 4-6 digit PIN flexibility. 
                // Actually, for simplicity, let's auto-verify at 6 or allow manual 'Enter' if length >= 4
                // Or just auto-verify on each step if length >= 4
            }
        }
    }

    // Auto-verify effect
    useEffect(() => {
        const verify = async () => {
            if (pin.length >= 4) {
                const isValid = await unlockApp(pin)
                if (isValid) {
                    setSuccess(true)
                    setError(false)
                } else {
                    if (pin.length === 6) { // Only show error on max length
                        setError(true)
                        setTimeout(() => {
                            setPin("")
                            setError(false)
                        }, 500)
                    }
                }
            }
        }
        verify()
    }, [pin, unlockApp])

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1))
        setError(false)
    }

    if (isLoading || !hasPin || !isLocked) return null

    return (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-sm flex flex-col items-center gap-8">

                {/* Icon & Status */}
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-primary/20 text-primary'
                        }`}>
                        {success ? <Unlock className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white tracking-tight">ProjectPro Locked</h1>
                        <p className="text-muted-foreground mt-2">Enter your PIN code to access</p>
                    </div>
                </div>

                {/* PIN Dots */}
                <div className={`flex gap-4 mb-4 ${error ? 'animate-shake' : ''}`}>
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                                    ? success ? 'bg-emerald-500 scale-110' : 'bg-white scale-110'
                                    : 'bg-white/10 scale-100'
                                }`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-6 w-full px-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="aspect-square rounded-full bg-zinc-900 border border-white/5 text-2xl font-medium text-white hover:bg-zinc-800 hover:border-white/10 transition-all active:scale-95 flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <div /> {/* Spacer */}
                    <button
                        onClick={() => handleNumberClick(0)}
                        className="aspect-square rounded-full bg-zinc-900 border border-white/5 text-2xl font-medium text-white hover:bg-zinc-800 hover:border-white/10 transition-all active:scale-95 flex items-center justify-center"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="aspect-square rounded-full bg-transparent text-white/50 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                    >
                        <Delete className="w-8 h-8" />
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Forgot PIN? (Reset App Data)
                        {/* We could add logic to reset app data here if critical */}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    )
}
