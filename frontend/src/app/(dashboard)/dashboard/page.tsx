"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, ShieldAlert, Sparkles, Activity } from "lucide-react";
import axios from "axios";
import { Card, Statistic, Spin, Tag } from "antd";
import toast from "react-hot-toast";

interface AgentAction {
  id: string;
  tool: string;
  action: string;
  status: string;
  timestamp: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ follow_ups: 0, appointments: 0, escalations: 0 });
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("careforme_token");
        const headers = { Authorization: `Bearer ${token}` };
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const [statsRes, actionsRes] = await Promise.all([
          axios.get(`${apiUrl}/api/stats`, { headers }),
          axios.get(`${apiUrl}/api/agent-actions`, { headers })
        ]);
        
        setStats(statsRes.data);
        setActions(actionsRes.data.slice(0, 5)); // Show only 5 most recent
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener("careforme_refresh_data", handleRefresh);
    return () => window.removeEventListener("careforme_refresh_data", handleRefresh);
  }, []);

  const statCards = [
    { title: "Follow-ups", value: stats.follow_ups, icon: <Clock className="text-primary" size={20} /> },
    { title: "Appointments", value: stats.appointments, icon: <Calendar className="text-primary" size={20} /> },
    { title: "Escalations", value: stats.escalations, icon: <ShieldAlert className="text-red-400" size={20} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-primary-light/50 p-5 rounded-[2rem] border border-primary-light flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">CareForMe is working for you.</h1>
          <p className="text-gray-600 mt-1 text-sm">Your autonomous administrative assistant is running smoothly.</p>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={36} className="text-primary opacity-50" />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 flex justify-center py-20"><Spin size="large" /></div>
        ) : (
          statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100 rounded-[2rem] overflow-hidden" styles={{ body: { padding: '20px' } }}>
                <div className="flex items-center justify-between">
                  <Statistic 
                    title={<span className="text-gray-500 font-bold text-xs uppercase tracking-wider">{stat.title}</span>} 
                    value={stat.value} 
                    valueStyle={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937', marginTop: '4px' }} 
                  />
                  <div className="bg-primary-light/40 p-3 rounded-xl">
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Recent Agent Activity
          </h2>
          <span className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Live Feed
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10"><Spin /></div>
        ) : actions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm italic">No recent activity. The agent is currently idle.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div key={action.id} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{action.tool}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(action.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{action.action}</p>
                </div>
                <div className="shrink-0 mt-1">
                  <Tag color={action.status === "COMPLETED" ? "green" : action.status === "REQUIRES_HUMAN_REVIEW" ? "orange" : "red"} className="m-0 border-0 shadow-sm rounded-full px-3 py-0.5 font-bold text-[10px]">
                    {action.status.replaceAll('_', ' ')}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
