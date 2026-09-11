"use client";

import { startTransition, useEffect, useState } from "react";
import axios from "axios";
import { Button, Form, Input, Modal, Select, Table, Tag } from "antd";
import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import toast from "react-hot-toast";

type Patient = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    contact?: string;
    preferred_contact_method?: string;
    status?: string;
};

type PatientForm = {
    name: string;
    email?: string;
    phone?: string;
    preferred_contact_method: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm<PatientForm>();

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem("careforme_token");
            const { data } = await axios.get<Patient[]>(`${API_URL}/api/patients`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const formatted = data.map(p => {
                let method = p.preferred_contact_method;
                if (method) {
                    const lower = method.toLowerCase();
                    if (lower === "whatsapp") method = "WhatsApp";
                    else if (lower === "sms") method = "SMS";
                }
                return { ...p, preferred_contact_method: method };
            });
            setPatients(formatted);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load patients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            void fetchPatients();
        });
        
        const handleRefresh = () => {
            void fetchPatients();
        };
        window.addEventListener("careforme_refresh_data", handleRefresh);
        return () => window.removeEventListener("careforme_refresh_data", handleRefresh);
    }, []);

    const handleAddPatient = async (values: any) => {
        setSaving(true);
        try {
            const token = localStorage.getItem("careforme_token");
            
            // Format phone number with country code, stripping any leading zeros from the local number
            const finalPhone = values.phone ? `${values.country_code}${values.phone.replace(/^0+/, '')}` : undefined;
            
            await axios.post(`${API_URL}/api/patients`, { ...values, phone: finalPhone }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Patient added");
            setIsModalOpen(false);
            form.resetFields();
            await fetchPatients();
        } catch (error) {
            console.error(error);
            toast.error("Could not add patient");
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", render: (text: string) => <span className="text-gray-400 text-sm">{text}</span> },
        { title: "Name", dataIndex: "name", key: "name", render: (text: string) => <span className="font-semibold text-gray-800">{text}</span> },
        { title: "Contact", key: "contact", render: (_: unknown, patient: Patient) => patient.contact || patient.phone || patient.email || "-" },
        { title: "Method", dataIndex: "preferred_contact_method", key: "method", render: (method?: string) => method || "-" },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status?: string) => <Tag color={status === "ACTIVE" ? "blue" : "default"} className="rounded-full px-3 py-1">{status || "ACTIVE"}</Tag>,
        },
    ];

    const prefixSelector = (
        <Form.Item name="country_code" noStyle>
            <Select style={{ width: 120 }} popupMatchSelectWidth={false}>
                <Select.Option value="+234">+234 (NG)</Select.Option>
                <Select.Option value="+1">+1 (US)</Select.Option>
                <Select.Option value="+44">+44 (UK)</Select.Option>
                <Select.Option value="+91">+91 (IN)</Select.Option>
                <Select.Option value="+61">+61 (AU)</Select.Option>
                <Select.Option value="+27">+27 (ZA)</Select.Option>
                <Select.Option value="+254">+254 (KE)</Select.Option>
            </Select>
        </Form.Item>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary-light rounded-xl text-primary"><Users size={20} /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Patients Directory</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage administrative patient records.</p>
                    </div>
                </motion.div>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>Add patient</Button>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm overflow-x-auto">
                    <Table dataSource={patients} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} size="small" scroll={{ x: 600 }} />
                </div>
            </motion.div>

            <Modal title="Add patient" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnHidden width={580}>
                <Form form={form} layout="vertical" onFinish={handleAddPatient} initialValues={{ preferred_contact_method: "SMS", country_code: "+234" }}>
                    <Form.Item name="name" label="Full name" rules={[{ required: true, message: "Enter the patient's name" }]}><Input placeholder="e.g. Sarah Jenkins" /></Form.Item>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Form.Item name="email" label="Email"><Input type="email" placeholder="patient@example.com" /></Form.Item>
                        <Form.Item label="Phone" style={{ marginBottom: 0 }}>
                            <div className="flex items-end gap-3">
                                {prefixSelector}
                                <Form.Item name="phone" noStyle><Input className="flex-1" placeholder="706 627 9211" /></Form.Item>
                            </div>
                        </Form.Item>
                    </div>
                    <Form.Item name="preferred_contact_method" label="Preferred contact method" rules={[{ required: true }]}>
                        <Select options={[{ value: "SMS", label: "SMS" }, { value: "WHATSAPP", label: "WhatsApp" }]} />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={saving}>Save patient</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
