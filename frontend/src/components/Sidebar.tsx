"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, LogOut } from "lucide-react";
import axios from "axios";
import { signOut } from "aws-amplify/auth";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Patients", href: "/patients" },
  { name: "Appointments", href: "/appointments" },
  { name: "Follow-ups", href: "/followups" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [clinic, setClinic] = useState<{ name: string, admin_email: string } | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem("careforme_token");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const token = localStorage.getItem("careforme_token");
        if (token) {
          const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}/api/clinics/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setClinic(data);
        }
      } catch (err) {
        console.error("Failed to fetch clinic details");
      }
    };
    fetchClinic();
  }, []);

  return (
    <div className="w-[260px] h-[calc(100vh-3rem)] m-6 bg-white border-2 border-gray-200 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="logo-cross logo-sidebar w-8 h-8" aria-label="CareForMe logo">
            <span /><span /><span /><span />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">CareForMe</h1>
        </motion.div>
      </div>

      <nav className="flex-1 px-6 py-4 space-y-4">
        {NAV_ITEMS.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          const num = `0${index + 1}`;

          return (
            <Link key={item.name} href={item.href} className="block">
              <motion.div
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-baseline gap-3">
                  <span className={`text-[10px] font-bold font-mono ${isActive ? "text-primary" : "text-gray-400"}`}>
                    {num}
                  </span>
                  <span className={`text-lg font-bold tracking-tight ${isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-800"}`}>
                    {item.name}
                  </span>
                </div>

                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isActive
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-gray-800 text-white group-hover:bg-gray-700"
                  }`}>
                  <ChevronRight size={16} strokeWidth={isActive ? 3 : 2} />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-gray-100 flex items-center justify-between">
        <div className="flex flex-col overflow-hidden mr-2">
          {clinic ? (
            <>
              <span className="text-sm font-bold text-gray-900 truncate">{clinic.name}</span>
              <span className="text-xs text-gray-500 truncate">{clinic.admin_email}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-500">Loading profile...</span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
