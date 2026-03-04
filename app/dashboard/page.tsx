"use client";

import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Dashboard() {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messages = useQuery(api.chat.getMessages) ?? [];
    const user = useQuery(api.users.currentUser);
    const startChat = useAction(api.chat.chat);
    const clearHistory = useMutation(api.chat.clearHistory);
    const createCheckout = useAction(api.stripe.createCheckoutSession);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg = input;
        setInput("");
        setIsTyping(true);

        try {
            await startChat({ message: userMsg });
        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleUpgrade = async () => {
        try {
            const checkoutUrl = await createCheckout({
                origin: window.location.origin
            });
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            }
        } catch (error) {
            console.error("Upgrade Error:", error);
            alert("Failed to initiate upgrade.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
            {/* Premium Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-all">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                            AI Dashboard
                        </Link>
                        {user?.isPro && (
                            <span className="ml-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Pro</span>
                        )}
                    </div>
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400">Overview</Link>
                        <Link href="/dashboard" className="hover:text-indigo-500 transition-colors">Analytics</Link>
                        <Link href="/dashboard" className="hover:text-indigo-500 transition-colors">Settings</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => clearHistory()}
                            className="text-xs text-slate-500 hover:text-red-500 transition-colors mr-4"
                        >
                            Clear History
                        </button>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* Main Grid Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Stats/Info */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Account Overview</h2>
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Status</p>
                                <p className="text-lg font-bold">{user?.isPro ? "Pro Member" : "Free Tier"}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Total Intelligence Tokens</p>
                                <p className="text-2xl font-bold">{user?.isPro ? "∞" : "1,248k"}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Messages Sent</p>
                                <p className="text-2xl font-bold">{messages.filter((m: any) => m.role === 'user').length}</p>
                            </div>
                        </div>
                    </div>

                    {!user?.isPro && (
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2">Upgrade to Pro</h3>
                                <p className="text-sm opacity-90 mb-4">Get access to unlimited messages and faster response times for life.</p>
                                <button
                                    onClick={handleUpgrade}
                                    className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
                                >
                                    Unlock Unlimited Pro — $19.99
                                </button>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                        </div>
                    )}
                </div>

                {/* Right/Center Column - Chatbot Interface */}
                <div className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="font-semibold text-sm">Gemini 3 Flash Assistant</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                        {messages.length === 0 && !isTyping && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                <div className="text-4xl">👋</div>
                                <p className="text-sm">Start a conversation to see AI powers in action.</p>
                            </div>
                        )}
                        {messages.map((m: any, idx: number) => (
                            <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50"
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>

                                    {m.role === "assistant" && m.reasoning_details && (
                                        <details className="mt-2 pt-2 border-t border-slate-300/30">
                                            <summary className="text-[10px] font-mono opacity-60 cursor-pointer hover:opacity-100">View Reasoning</summary>
                                            <div className="mt-2 text-[10px] font-mono opacity-50 overflow-auto bg-black/5 p-2 rounded">
                                                {m.reasoning_details}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        void handleSubmit(e as any);
                                    }
                                }}
                                placeholder="Ask anything..."
                                disabled={isTyping}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg transition-colors shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
