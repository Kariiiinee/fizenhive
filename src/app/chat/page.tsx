"use client";

import { useState } from "react";
import { Mic, Paperclip, Send, Bot, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isError?: boolean;
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I'm FizenHive AI. How can I help you analyze your portfolio or the markets today?",
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Add user message
        const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: input };
        const updatedMessages = [...messages, newUserMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    language: navigator.language.startsWith('fr') ? 'fr' : 'en'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch response');
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.content,
            }]);
        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.",
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 space-y-4">
            <header className="flex items-center gap-2 py-2 shrink-0">
                <div className="relative">
                    <Bot className="w-8 h-8 text-primary" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background"></span>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">FizenHive AI</h1>
                    <p className="text-xs text-muted-foreground font-medium">Online</p>
                </div>
            </header>

            {/* Disclaimer Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-foreground mb-2 flex gap-2 items-start shrink-0">
                <div className="text-primary mt-0.5">ℹ️</div>
                <p>
                    <strong>Educational Purposes Only:</strong> As FizenHive AI, I provide neutral, educational information to help you understand companies and financial concepts. I do not provide investment advice or recommendations to buy, sell, or hold.
                </p>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pb-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[85%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.role === "user" ? "bg-secondary" : "bg-primary/20 text-primary"}`}>
                                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`px-4 py-3 rounded-2xl ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : `bg-card border border-border rounded-tl-sm ${msg.isError ? 'text-destructive' : 'text-foreground'}`}`}>
                                {msg.role === "user" ? (
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                ) : (
                                    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground prose-a:text-primary">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex max-w-[85%] gap-2 flex-row">
                            <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center bg-primary/20 text-primary">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-card border border-border rounded-tl-sm text-foreground flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="shrink-0 pt-2 pb-safe">
                <form onSubmit={handleSend} className="flex relative items-center">
                    <button type="button" className="absolute left-3 text-muted-foreground hover:text-primary transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Fizenhive anything..."
                        className="w-full bg-card border border-border rounded-full py-3.5 pl-12 pr-24 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        <button type="button" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
