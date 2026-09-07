"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Tag } from "antd";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await axios.get("http://127.0.0.1:8000/api/patients");
        setPatients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (text: string) => <span className="text-gray-400 text-sm">{text}</span> },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-gray-800">{text}</span> },
    { title: 'Contact', dataIndex: 'contact', key: 'contact' },
    { title: 'Method', dataIndex: 'preferred_contact_method', key: 'method' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'blue' : 'default'} className="rounded-full px-3 py-1">
          {status}
        </Tag>
      )
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary-light rounded-xl text-primary"><Users size={20} /></div>
        <h1 className="text-2xl font-bold text-gray-800">Patients Directory</h1>
      </motion.div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <Table 
            dataSource={patients} 
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
