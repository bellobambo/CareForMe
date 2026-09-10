"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, X, MessageCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
}

export default function AgentChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "agent", content: "Hello! I'm CareForMe, your autonomous clinic assistant. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("careforme_token");
      const { data } = await axios.post("https://careforme-api.onrender.com/api/chat", 
        { message: userMsg.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "agent", content: data.response }]);
    } catch (error) {
      toast.error("Failed to connect to agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-[1.5rem] border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary p-1.5 rounded-full text-white">
                  <Bot size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">CareForMe Agent</h2>
                  <p className="text-[10px] text-gray-500">Autonomous Operations Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-gray-800 text-white" : "bg-primary text-white"}`}>
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.role === "user" ? "bg-gray-800 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none"}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary text-white">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white border border-gray-100 px-3 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask the agent..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-primary transition-colors"
                  disabled={loading}
                />
                <button 
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
