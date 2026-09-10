"use client";

import { startTransition, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Empty, Spin, Tag } from "antd";
import { ClipboardList, Clock } from "lucide-react";
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

const API_URL = "https://careforme-api.onrender.com";

export default function FollowupsPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startTransition(() => {
      void (async () => {
        try {
          const token = localStorage.getItem("careforme_token");
          const { data } = await axios.get<FollowUpTask[]>(`${API_URL}/api/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTasks(data.filter((task) => task.status !== "COMPLETED"));
        } catch (error) {
          console.error(error);
          toast.error("Failed to load follow-up queue");
        } finally {
          setLoading(false);
        }
      })();
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gray-100 rounded-xl text-gray-700"><ClipboardList size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Follow-up queue</h1>
          <p className="text-sm text-gray-500 mt-1">The agent works these tasks in the background and surfaces exceptions here.</p>
        </div>
      </motion.div>

      <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 p-4 flex gap-3 text-amber-800 text-sm">
        <Clock size={20} className="shrink-0 text-amber-500" />
        <div>
          <strong>CareForMe is handling routine follow-ups automatically.</strong>
          <p className="mt-0.5 opacity-90">Review this queue when a task is waiting, overdue, or requires staff judgment.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
        {loading ? <div className="flex justify-center py-16"><Spin size="large" /></div> : tasks.length === 0 ? <Empty description="No pending follow-ups" className="py-12" /> : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-4 border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-gray-100 rounded-xl text-gray-700 shrink-0"><Clock size={17} /></div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">{task.type.replaceAll("_", " ")}</p>
                    <p className="text-sm text-gray-500">Patient: {task.patient_id}</p>
                    {task.created_at && <p className="text-xs text-gray-400 mt-1">Created {new Date(task.created_at).toLocaleString()}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.priority && <Tag color={task.priority === "HIGH" ? "red" : "default"}>{task.priority}</Tag>}
                  <Tag color={task.status === "REQUIRES_HUMAN_REVIEW" ? "orange" : "default"}>{task.status.replaceAll("_", " ")}</Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
