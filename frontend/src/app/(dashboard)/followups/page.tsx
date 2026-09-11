"use client";

import { startTransition, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Empty, Spin, Tag, Button, Select } from "antd";
import { ClipboardList, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type FollowUpTask = {
  id: string;
  type: string;
  patient_id: string;
  priority?: string;
  status: string;
  created_at?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function FollowupsPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("careforme_token");
        const { data } = await axios.get<FollowUpTask[]>(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(data.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load follow-up queue");
      } finally {
        setLoading(false);
      }
    };

    startTransition(() => {
      void fetchTasks();
    });

    const handleRefresh = () => {
      void fetchTasks();
    };
    window.addEventListener("careforme_refresh_data", handleRefresh);
    return () => window.removeEventListener("careforme_refresh_data", handleRefresh);
  }, []);

  const handleResolve = async (taskId: string) => {
    try {
      const token = localStorage.getItem("careforme_token");
      await axios.put(`${API_URL}/api/tasks/${taskId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "RESOLVED" } : t));
      toast.success("Task marked as resolved!");
    } catch (e) {
      toast.error("Failed to resolve task");
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "PENDING") return task.status !== "RESOLVED";
    if (filter === "RESOLVED") return task.status === "RESOLVED";
    if (filter === "ESCALATION") return task.type === "ESCALATION";
    if (filter === "RESCHEDULE") return task.type === "RESCHEDULE_REQUESTED";
    return true; // "ALL"
  });

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1">
            <div className="p-2.5 bg-gray-100 rounded-xl text-gray-700 shrink-0"><ClipboardList size={20} /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Follow-up queue</h1>
              <p className="text-sm text-gray-500 mt-1">The agent works these tasks in the background and surfaces exceptions here.</p>
            </div>
        </div>
        <Select 
          value={filter} 
          onChange={setFilter} 
          className="w-full sm:w-[160px]"
          options={[
            { value: "PENDING", label: "Pending tasks" },
            { value: "ESCALATION", label: "Escalations" },
            { value: "RESCHEDULE", label: "Reschedule requests" },
            { value: "RESOLVED", label: "Resolved tasks" },
            { value: "ALL", label: "All tasks" }
          ]}
        />
      </motion.div>

      <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 p-4 flex gap-3 text-amber-800 text-sm">
        <Clock size={20} className="shrink-0 text-amber-500" />
        <div>
          <strong>CareForMe is handling routine follow-ups automatically.</strong>
          <p className="mt-0.5 opacity-90">Review this queue when a task is waiting, overdue, or requires staff judgment.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
        {loading ? <div className="flex justify-center py-16"><Spin size="large" /></div> : filteredTasks.length === 0 ? <Empty description="No tasks found for this filter" className="py-12" /> : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start gap-3 min-w-0 w-full sm:w-auto">
                  <div className="p-2 bg-gray-100 rounded-xl text-gray-700 shrink-0"><Clock size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 truncate">{task.type.replaceAll("_", " ")}</p>
                    <p className="text-sm text-gray-500">Patient: {task.patient_id}</p>
                    {task.created_at && <p className="text-xs text-gray-400 mt-1">Created {new Date(task.created_at).toLocaleString()}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start sm:self-auto ml-11 sm:ml-0">
                  {task.priority && <Tag color={task.priority === "HIGH" ? "red" : "default"}>{task.priority}</Tag>}
                  <Tag color={task.status === "REQUIRES_HUMAN_REVIEW" ? "orange" : (task.status === "RESOLVED" ? "green" : "default")}>{task.status.replaceAll("_", " ")}</Tag>
                  {task.status !== "RESOLVED" && (
                    <Button type="primary" size="small" icon={<CheckCircle size={14} />} onClick={() => handleResolve(task.id)}>Resolve</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
