"use client";

import React from "react";
import {
    Send,
    Paperclip,
    Image as ImageIcon,
    MoreVertical,
    Phone,
    Video,
    ChevronLeft,
    Zap,
    History,
    Clock,
    Hash,
    ExternalLink,
    MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const messages = [
    { id: 1, sender: 'John Doe', text: 'Sawasdee krab, I have a question about my order.', time: '10:30 AM', direction: 'inbound', platform: 'meta' },
    { id: 2, sender: 'Agent', text: 'Sawasdee krab! I can help with that. Could you please provide your order ID?', time: '10:32 AM', direction: 'outbound' },
    { id: 3, sender: 'John Doe', text: 'Sure, it is #45892.', time: '10:33 AM', direction: 'inbound', platform: 'meta' },
    { id: 4, sender: 'Agent', text: 'Thank you. Let me check that for you. One moment please.', time: '10:35 AM', direction: 'outbound' },
];

const quickReplies = [
    "ขออภัยที่ตอบช้าครับ",
    "ขอดูออเดอร์ให้สักครู่ครับ",
    "ยินดีให้บริการครับ 😊",
    "ต้องการสอบถามข้อมูลด้านไหนครับ",
];

export function ChatWindow({
    onBack,
    isVisible,
    mode = 'DM'
}: {
    onBack: () => void,
    isVisible: boolean,
    mode?: 'DM' | 'COMMENT'
}) {
    const [inputText, setInputText] = React.useState("");

    if (!isVisible) return null;

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-background animate-in fade-in slide-in-from-right-4 duration-300 relative z-10">
            {/* Header */}
            <div className="h-16 px-4 lg:px-6 flex items-center justify-between bg-card/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm border-none">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-secondary"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shadow-sm">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm truncate">John Doe</span>
                                <span className={cn(
                                    "hidden sm:inline-block text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider shadow-sm",
                                    mode === 'COMMENT' ? "bg-blue-500/10 text-blue-500" : "bg-pink-500/10 text-pink-500"
                                )}>
                                    {mode === 'COMMENT' ? 'Comment' : 'Meta'}
                                </span>
                            </div>
                            <span className="text-[9px] text-green-500 font-bold flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                Live
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {mode === 'DM' && (
                        <div className="hidden md:flex items-center gap-1">
                            <HeaderButton icon={<Phone size={16} />} />
                            <HeaderButton icon={<Video size={16} />} />
                        </div>
                    )}
                    <HeaderButton icon={<History size={16} />} />
                    <HeaderButton icon={<MoreVertical size={16} />} />
                </div>
            </div>

            {/* Post Context Detail - Only shown in COMMENT mode */}
            {mode === 'COMMENT' && (
                <div className="px-4 py-3 bg-secondary/20 backdrop-blur-md">
                    <div className="bg-card rounded-xl p-3 shadow-sm flex items-start gap-3 max-w-4xl mx-auto group">
                        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                            <Hash size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[8px] font-black text-primary uppercase tracking-widest">Post Info</span>
                                <button className="text-[8px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
                                    <ExternalLink size={8} /> FB
                                </button>
                            </div>
                            <h4 className="font-bold text-xs truncate mb-0.5">Title of the post goes here...</h4>
                            <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1"><MessageCircle size={8} /> 124</span>
                                <span className="flex items-center gap-1"><Zap size={8} /> 1.2k</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.02),transparent_40%)]">
                {messages.map((m) => (
                    <div key={m.id} className={cn("flex flex-col group", m.direction === 'outbound' ? "items-end" : "items-start")}>
                        <div className={cn(
                            "flex flex-col",
                            m.direction === 'outbound' ? "items-end" : "items-start"
                        )}>
                            <div className={cn(
                                "max-w-[85%] lg:max-w-[70%] px-4 py-3 rounded-2xl text-xs relative transition-all duration-300 shadow-sm",
                                m.direction === 'outbound'
                                    ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/10"
                                    : "bg-card text-foreground rounded-tl-none border border-border/30"
                            )}>
                                {m.text}
                            </div>
                            <div className={cn(
                                "flex items-center gap-1.5 mt-1.5 px-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest transition-opacity opacity-0 group-hover:opacity-100",
                            )}>
                                <Clock size={8} />
                                {m.time}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Replies Tray */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-card/30 shadow-inner">
                {quickReplies.map((reply, i) => (
                    <button
                        key={i}
                        onClick={() => setInputText(reply)}
                        className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-card text-[10px] text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md transition-all font-semibold"
                    >
                        {reply}
                    </button>
                ))}
            </div>

            {/* Footer / Input Area */}
            <div className="p-4 bg-card/80 backdrop-blur-2xl">
                <div className="max-w-4xl mx-auto flex items-end gap-2 bg-secondary/30 rounded-2xl p-2 relative group focus-within:bg-card transition-all duration-300 shadow-md">
                    <div className="hidden sm:flex items-center gap-1 pb-1 ml-1 text-muted-foreground">
                        <FooterButton icon={<ImageIcon size={18} />} />
                        <FooterButton icon={<Paperclip size={18} />} />
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-foreground py-2 px-1 resize-none max-h-32 min-h-[40px] text-xs scrollbar-hide placeholder:text-muted-foreground font-medium"
                        rows={1}
                    />
                    <button className={cn(
                        "p-2.5 rounded-xl transition-all shadow-md active:scale-95 group shrink-0",
                        inputText ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-muted text-muted-foreground"
                    )}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function HeaderButton({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all shadow-none hover:shadow-sm">
            {icon}
        </button>
    );
}

function FooterButton({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="p-2 hover:text-foreground hover:bg-card rounded-lg transition-all">
            {icon}
        </button>
    );
}
