"use client";

import React from "react";
import { ThreadList } from "@/components/chat/thread-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { DashboardHome } from "@/components/chat/dashboard-home";
import { MessageSquare, Hash, LayoutDashboard, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [selectedThread, setSelectedThread] = React.useState<number | null>(null);
    const [mobileView, setMobileView] = React.useState<'list' | 'chat' | 'dashboard'>('dashboard');

    const handleSelectThread = (id: number) => {
        setSelectedThread(id);
        setMobileView('chat');
    };

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        setSelectedThread(null);
        if (id === 'dashboard') setMobileView('dashboard');
        else setMobileView('list');
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
            {/* Sub Sidebar / Category Navigation */}
            <div className="hidden lg:flex w-20 flex-col items-center py-6 bg-card/30 border-r border-border/50 gap-6">
                <TabButton
                    active={activeTab === 'dashboard'}
                    onClick={() => handleTabChange('dashboard')}
                    icon={<LayoutDashboard size={20} />}
                    label="Stats"
                />
                <div className="w-10 h-px bg-border/50" />
                <TabButton
                    active={activeTab === 'all'}
                    onClick={() => handleTabChange('all')}
                    icon={<MessageCircle size={20} />}
                    label="DMs"
                    badge={23}
                />
                <TabButton
                    active={activeTab === 'comments'}
                    onClick={() => handleTabChange('comments')}
                    icon={<Hash size={20} />}
                    label="Posts"
                    badge={5}
                />
                <div className="w-10 h-px bg-border/50" />
                <TabButton
                    active={activeTab === 'customers'}
                    onClick={() => handleTabChange('customers')}
                    icon={<Users size={20} />}
                    label="CRM"
                />
            </div>

            <div className="flex-1 flex overflow-hidden">
                {activeTab === 'dashboard' ? (
                    <DashboardHome />
                ) : (
                    <>
                        <div className={cn(
                            "flex-shrink-0 transition-all duration-300 lg:block border-r border-border/50",
                            mobileView === 'list' ? "w-full lg:w-80 block" : "hidden"
                        )}>
                            <ThreadList
                                selectedId={selectedThread}
                                onSelectThread={handleSelectThread}
                                isVisible={true}
                                mode={activeTab === 'comments' ? 'COMMENT' : 'DM'}
                            />
                        </div>

                        <div className={cn(
                            "flex-1 transition-all duration-300 lg:block",
                            mobileView === 'chat' ? "block" : "hidden"
                        )}>
                            <ChatWindow
                                onBack={() => setMobileView('list')}
                                isVisible={true}
                                mode={activeTab === 'comments' ? 'COMMENT' : 'DM'}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    label,
    badge
}: {
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    badge?: number
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all relative group",
                active
                    ? "text-primary bg-primary/5 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
        >
            <div className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card shadow-sm"
            )}>
                {icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter scale-90">{label}</span>

            {badge && !active && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-[8px] font-black text-primary-foreground flex items-center justify-center rounded-full shadow-md border-2 border-background">
                    {badge}
                </span>
            )}
        </button>
    );
}
