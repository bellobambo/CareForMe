"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import AgentChatWidget from "@/components/AgentChatWidget";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen relative">
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center px-6 justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <div className="logo-cross logo-sidebar w-6 h-6"><span /><span /><span /><span /></div>
             <span className="font-bold text-gray-800">CareForMe</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600">
            <Menu size={24} />
          </button>
        </div>

        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <main className="flex-1 md:ml-[300px] p-4 md:p-8 pt-20 md:pt-8 w-full overflow-x-hidden">
          {children}
        </main>
        <AgentChatWidget />
      </div>
    </AuthGuard>
  );
}
