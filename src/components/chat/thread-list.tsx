"use client";

import React from "react";
import { Search, Filter, CheckCircle2, MessageSquare, Clock, Hash, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const chatThreads = [
    { id: 1, name: 'John Doe', lastMsg: 'Sure, it is #45892.', time: '2m', platform: 'meta', unread: 2, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', status: 'pending', type: 'DM' },
    { id: 2, name: 'Sarah Wilson', lastMsg: 'When will I receive my pack...', time: '15m', platform: 'line', unread: 0, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'replied', type: 'DM' },
    { id: 3, name: 'Michael Chen', lastMsg: 'Thanks for the quick response!', time: '1h', platform: 'youtube', unread: 0, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', status: 'resolved', type: 'DM' },
];

const commentThreads = [
    { id: 101, name: 'Somchai Jaidee', lastMsg: 'สนใจราคานี้ครับ สั่งได้ที่ไหน?', time: '5m', platform: 'meta', unread: 1, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai', status: 'pending', type: 'COMMENT', postTitle: 'โปรโมชั่นต้อนรับปีใหม่!' },
    { id: 102, name: 'Wipawee S.', lastMsg: 'รีวิวดีมากเลยค่ะ อยากลองใช้บ้าง', time: '1h', platform: 'youtube', unread: 0, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wipawee', status: 'replied', type: 'COMMENT', postTitle: 'รีวิวการใช้งาน HS Chat v1.0' },
    { id: 103, name: 'Kitti Pun', lastMsg: 'ส่งของยังไงครับ?', time: '3h', platform: 'meta', unread: 3, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kitti', status: 'pending', type: 'COMMENT', postTitle: 'โปรโมชั่นต้อนรับปีใหม่!' },
];

export interface Thread {
    id: number;
    name: string;
    lastMsg: string;
    time: string;
    platform: string;
    unread: number;
    avatar: string;
    status: string;
    type: string;
    postTitle?: string;
}

export function ThreadList({
    onSelectThread,
    selectedId,
    isVisible,
    mode = 'DM'
}: {
    onSelectThread: (id: number) => void,
    selectedId: number | null,
    isVisible: boolean,
    mode?: 'DM' | 'COMMENT'
}) {
    const [filter, setFilter] = React.useState('all');
    const threads: Thread[] = (mode === 'DM' ? chatThreads : commentThreads) as Thread[];

    if (!isVisible) return null;

    return (
        <div className="w-full lg:w-80 h-[calc(100vh-4rem)] bg-background flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                            {mode === 'DM' ? 'Messages' : 'Comments'}
                        </h2>
                    </div>
                    <button className="p-2 rounded-xl bg-card text-muted-foreground hover:text-foreground transition-all shadow-sm">
                        <Filter size={16} />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-card rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:ring-4 focus:ring-primary/10 outline-none shadow-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-5">
                {threads.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onSelectThread(t.id)}
                        className={cn(
                            "w-full px-3 py-3 mb-1.5 flex flex-col gap-2.5 transition-all rounded-2xl relative overflow-hidden group/item",
                            selectedId === t.id
                                ? "bg-card shadow-md border border-border/50"
                                : "hover:bg-card/50 hover:shadow-sm"
                        )}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className="relative flex-shrink-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl overflow-hidden shadow-sm",
                                    selectedId === t.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                )}>
                                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                                </div>
                                <div className={cn(
                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background shadow-xs",
                                    t.platform === 'line' ? 'bg-green-500' : t.platform === 'meta' ? 'bg-pink-500' : 'bg-red-500'
                                )} />
                            </div>

                            <div className="flex-1 text-left overflow-hidden">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-bold text-xs truncate text-foreground">{t.name}</span>
                                    <span className="text-[9px] text-muted-foreground font-bold">{t.time}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                        "text-[11px] truncate overflow-hidden flex-1",
                                        t.unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"
                                    )}>{t.lastMsg}</p>
                                    {t.unread > 0 && (
                                        <span className="bg-primary text-[9px] font-bold text-primary-foreground px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {t.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {mode === 'COMMENT' && t.postTitle && (
                            <div className="ml-13 px-2 py-1 bg-secondary/40 rounded-lg flex items-center gap-1.5 max-w-full">
                                <Hash size={8} className="text-primary shrink-0" />
                                <span className="text-[9px] font-bold text-muted-foreground truncate uppercase tracking-tight">{t.postTitle}</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
