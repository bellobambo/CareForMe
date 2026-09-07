"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import axios from "axios";
import { Button, Input } from "antd";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "agent", content: "Hello! I am CareForMe, your autonomous clinic operations agent. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("http://127.0.0.1:8000/api/chat", { message: userMsg.content });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "agent", content: data.response }]);
    } catch (error) {
      toast.error("Failed to connect to agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[80vh] flex flex-col bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative">
      <div className="bg-primary/10 px-5 py-3 border-b border-primary/20 flex items-center gap-3">
        <div className="bg-primary p-1.5 rounded-full text-white">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">CareForMe Agent</h2>
          <p className="text-xs text-gray-500">Autonomous Operations Assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === "user" ? "bg-gray-800 text-white" : "bg-primary text-white"}`}>
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[75%] p-4 rounded-2xl ${msg.role === "user" ? "bg-gray-800 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none"}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary text-white">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-primary rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input 
            size="large"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask the agent to check follow-ups, or simulate a patient message..."
            className="rounded-xl border-gray-200 hover:border-primary focus:border-primary"
            disabled={loading}
          />
          <Button 
            type="primary" 
            size="large"
            icon={<Send size={18} />} 
            onClick={sendMessage}
            loading={loading}
            className="rounded-xl flex items-center justify-center px-6 h-auto"
          />
        </form>
      </div>
    </div>
  );
}
