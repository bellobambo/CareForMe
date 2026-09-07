"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Tag } from "antd";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export default function AppointmentsPage() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppts = async () => {
      try {
        const { data } = await axios.get("http://127.0.0.1:8000/api/appointments");
        setAppts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppts();
  }, []);

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (text: string) => <span className="font-medium">{text}</span> },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Patient ID', dataIndex: 'patient_id', key: 'patient_id' },
    { title: 'Doctor', dataIndex: 'doctor_id', key: 'doctor_id' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = "default";
        if (status === "SCHEDULED") color = "blue";
        if (status === "RESCHEDULED") color = "orange";
        return <Tag color={color} className="rounded-full px-3">{status}</Tag>
      }
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary-light rounded-xl text-primary"><Calendar size={20} /></div>
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
      </motion.div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <Table 
            dataSource={appts} 
            columns={columns} 
            rowKey="id" 
            loading={loading}
            pagination={false}
            size="small"
          />
        </div>
      </motion.div>
    </div>
  );
}
