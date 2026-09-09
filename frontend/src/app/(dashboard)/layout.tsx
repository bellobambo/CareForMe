import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import AgentChatWidget from "@/components/AgentChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-[300px] p-8">
          {children}
        </main>
        <AgentChatWidget />
      </div>
    </AuthGuard>
  );
}
