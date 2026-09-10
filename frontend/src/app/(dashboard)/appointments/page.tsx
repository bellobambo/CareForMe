"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Filter, Plus, RefreshCw, Tag as TagIcon } from "lucide-react";
import { Button, Form, Input, InputNumber, Modal, Select, Table, Tag , Popover } from "antd";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type Patient = { id: string; name: string };
type Appointment = { id: string; patient_id: string; doctor_id: string; date: string; time: string; duration?: number; type?: string; status: string };
type AppointmentForm = { patient_id: string; doctor_id: string; date: string; time: string; duration: number; type: string };
type RescheduleForm = { date: string; time: string };

const API_URL = "https://careforme-api.onrender.com";
const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 24;
const HOUR_HEIGHT = 120;

const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const startOfWeek = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day);
    result.setHours(0, 0, 0, 0);
    return result;
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

const statusTone = (status: string) => {
    if (status === "RESCHEDULED") return "amber";
    if (status === "COMPLETED") return "mint";
    if (status === "CANCELLED") return "coral";
    if (status === "NO_SHOW") return "gray";
    return "sky";
};

const formatAppointmentStatus = (status: string) =>
    status
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const appointmentStatusTagColor = (status: string) => {
    if (status === "COMPLETED") return "green";
    if (status === "SCHEDULED") return "blue";
    if (status === "RESCHEDULED") return "orange";
    return "default";
};




export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<{id: string, name: string, phone: string}[]>([]);
    const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
    const [doctorForm] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
    const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [createForm] = Form.useForm<AppointmentForm>();
    const [rescheduleForm] = Form.useForm<RescheduleForm>();

    const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("careforme_token")}` } });

    const fetchData = useCallback(async () => {
        try {
            const [{ data: appointmentData }, { data: patientData }, { data: doctorData }] = await Promise.all([
                axios.get<Appointment[]>(`${API_URL}/api/appointments`, authConfig()),
                axios.get<Patient[]>(`${API_URL}/api/patients`, authConfig()),
                axios.get(`${API_URL}/api/doctors`, authConfig())
            ]);
            setAppointments(appointmentData);
            setPatients(patientData);
            setDoctors(doctorData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load appointment data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        startTransition(() => {
            void fetchData();
        });
    }, [fetchData]);

    const handleAddDoctor = async (values: { name: string, phone: string }) => {
        try {
            setSaving(true);
            const res = await axios.post(`${API_URL}/api/doctors`, values, authConfig());
            setDoctors([...doctors, res.data]);
            setIsAddDoctorOpen(false);
            doctorForm.resetFields();
            createForm.setFieldsValue({ doctor_id: res.data.name });
            toast.success("Doctor added");
        } catch (e) {
            toast.error("Failed to add doctor");
        } finally {
            setSaving(false);
        }
    };

    const handleSchedule = async (values: AppointmentForm) => {
        setSaving(true);
        try {
            await axios.post(`${API_URL}/api/appointments`, values, authConfig());
            toast.success("Appointment scheduled");
            setIsCreateOpen(false);
            createForm.resetFields();
            await fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Could not schedule appointment");
        } finally {
            setSaving(false);
        }
    };

    const openReschedule = (appointment: Appointment) => {
        setRescheduling(appointment);
        rescheduleForm.setFieldsValue({ date: appointment.date, time: appointment.time });
    };

    const handleReschedule = async (values: RescheduleForm) => {
        if (!rescheduling) return;
        setSaving(true);
        try {
            await axios.put(`${API_URL}/api/appointments/${rescheduling.id}`, values, authConfig());
            toast.success("Appointment rescheduled");
            setRescheduling(null);
            await fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Could not reschedule appointment");
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        { title: "Date", dataIndex: "date", key: "date", render: (text: string) => <span className="font-medium">{text}</span> },
        { title: "Time", dataIndex: "time", key: "time" },
        { title: "Patient", key: "patient", render: (_: unknown, appointment: Appointment) => patients.find((patient) => patient.id === appointment.patient_id)?.name || appointment.patient_id },
        { title: "Doctor", dataIndex: "doctor_id", key: "doctor_id" },
        { title: "Duration", key: "duration", render: (_: unknown, appointment: Appointment) => `${appointment.duration || 30} min` },
        { title: "Type", dataIndex: "type", key: "type" },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Tag color={appointmentStatusTagColor(status)} className="rounded-full px-3">
                    {formatAppointmentStatus(status)}
                </Tag>
            ),
        },
        { title: "", key: "actions", render: (_: unknown, appointment: Appointment) => <Button type="text" icon={<RefreshCw size={16} />} title="Reschedule appointment" onClick={() => openReschedule(appointment)} /> },
    ];

    const patientName = (patientId: string) => patients.find((patient) => patient.id === patientId)?.name || patientId;
    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekAnchor, index));
    const weekAppointments = appointments.filter((appointment) => {
        const isInWeek = appointment.date >= formatDateKey(weekDays[0]) && appointment.date <= formatDateKey(weekDays[6]);
        return isInWeek && (statusFilter === "ALL" || appointment.status === statusFilter);
    });
    const hourSlots = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }, (_, index) => CALENDAR_START_HOUR + index);
    const weekLabel = weekAnchor.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
    const weekEndLabel = addDays(weekAnchor, 6).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    const moveWeek = (days: number) => setWeekAnchor((currentWeek) => addDays(currentWeek, days));
    const resetToCurrentWeek = () => setWeekAnchor(startOfWeek(new Date()));

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary-light rounded-xl text-primary"><Calendar size={20} /></div>
                    <div><h1 className="text-2xl font-bold text-gray-800">Appointments</h1><p className="text-sm text-gray-500 mt-1">Schedule and coordinate routine visits.</p></div>
                </motion.div>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>Add appointment</Button>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="bg-[#fffdfc] rounded-[2rem] border border-[#f1e9e6] shadow-[0_16px_45px_rgba(69,41,33,0.06)] overflow-hidden mb-6">
                    <div className="p-5 md:p-6 border-b border-[#f1e9e6] bg-[linear-gradient(110deg,#fff8f6_0%,#fffdfc_58%,#f8fcfb_100%)]">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                            <div>
                                <div className="ekg-container" title="Live clinic rhythm">
                                    <svg width="60" height="20" viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="0 10 10 10 15 3 20 17 25 10 60 10" className="ekg-line" /></svg>
                                </div>
                                <div className="flex flex-wrap items-end gap-x-4 gap-y-2 mt-2">
                                    <h2 className="text-2xl font-extrabold text-[#282321]">Weekly schedule</h2>
                                    <span className="text-sm text-[#897e7a] pb-0.5">{weekLabel} - {weekEndLabel}</span>
                                </div>
                                <p className="text-sm text-[#897e7a] mt-1">A calmer view of every handoff, follow-up, and patient arrival.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="text" icon={<ChevronLeft size={17} />} onClick={() => moveWeek(-7)} aria-label="Previous week" />
                                <Button className="!rounded-xl !border-[#eadfdb] !font-bold !text-[#584c48]" onClick={resetToCurrentWeek}>Today</Button>
                                <Button type="text" icon={<ChevronRight size={17} />} onClick={() => moveWeek(7)} aria-label="Next week" />
                                <Select
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    suffixIcon={<Filter size={14} />}
                                    className="ml-2 min-w-[132px]"
                                    options={[{ value: "ALL", label: "All statuses" }, { value: "SCHEDULED", label: "Scheduled" }, { value: "RESCHEDULED", label: "Rescheduled" }, { value: "COMPLETED", label: "Completed" }, { value: "CANCELLED", label: "Cancelled" }]}
                                />
                                <Button type="text" icon={isCalendarExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />} onClick={() => setIsCalendarExpanded(!isCalendarExpanded)} aria-label="Toggle calendar visibility" />
                            </div>
                        </div>
                        <div className="flex items-center gap-5 mt-5 text-xs font-bold text-[#897e7a] flex-wrap">
                            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" /> Scheduled</span>
                            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" /> Completed</span>
                            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" /> Rescheduled</span>
                            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#8E8E93]" /> No-show</span>
                            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" /> Cancelled</span>
                            <span className="ml-auto text-[#514641]"><strong className="text-lg">{weekAppointments.length}</strong> appointments this week</span>
                        </div>
                    </div>

                    {isCalendarExpanded && (
                        <div className="overflow-x-auto border-t border-[#f1e9e6]">
                            <div className="min-w-[920px]">
                                <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-b border-[#f1e9e6] bg-white">
                                <div className="p-3 text-[10px] uppercase tracking-wider text-[#b0a29d]" title="Appointment times are shown in GMT+1">GMT +1</div>
                                {weekDays.map((day) => {
                                    const isToday = formatDateKey(day) === formatDateKey(new Date());
                                    return <button key={formatDateKey(day)} onClick={() => setWeekAnchor(startOfWeek(day))} className={`px-2 py-3 text-center border-l border-[#f1e9e6] transition-colors ${isToday ? "bg-primary-light/50" : "hover:bg-[#fff8f6]"}`}><span className="block text-[10px] uppercase font-bold text-[#9d918d]">{day.toLocaleDateString([], { weekday: "short" })}</span><span className={`inline-flex items-center justify-center w-8 h-8 mt-1 rounded-full text-sm font-extrabold ${isToday ? "bg-primary text-white" : "text-[#403632]"}`}>{day.getDate()}</span></button>;
                                })}
                            </div>
                            <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))]">
                                <div className="bg-[#fffdfc]">
                                    {hourSlots.map((hour) => <div key={hour} className="h-[120px] px-3 pt-2 text-[10px] font-bold text-[#aa9d98] border-b border-[#f4eeeb]">{new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: "numeric", hour12: true })}</div>)}
                                </div>
                                {weekDays.map((day) => {
                                    const dayKey = formatDateKey(day);
                                    const dayAppointments = weekAppointments.filter((appointment) => appointment.date === dayKey);
                                    return <div key={dayKey} className="relative border-l border-[#f1e9e6] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_119px,#f4eeeb_119px,#f4eeeb_120px)]" style={{ height: hourSlots.length * HOUR_HEIGHT }}>
                                        {(() => {
                                        const validAppts = dayAppointments.filter(appt => timeToMinutes(appt.time) >= CALENDAR_START_HOUR * 60).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
                                        
                                        const groupedAppointments: typeof validAppts[] = [];
                                        let currentGroup: typeof validAppts = [];
                                        let currentGroupEnd = -1;
                                        
                                        validAppts.forEach(appt => {
                                            const start = timeToMinutes(appt.time);
                                            const end = start + (appt.duration || 30);
                                            if (currentGroup.length === 0) {
                                                currentGroup = [appt];
                                                currentGroupEnd = end;
                                            } else {
                                                if (start < currentGroupEnd) {
                                                    currentGroup.push(appt);
                                                    currentGroupEnd = Math.max(currentGroupEnd, end);
                                                } else {
                                                    groupedAppointments.push(currentGroup);
                                                    currentGroup = [appt];
                                                    currentGroupEnd = end;
                                                }
                                            }
                                        });
                                        if (currentGroup.length > 0) groupedAppointments.push(currentGroup);
                                        
                                        return groupedAppointments.map((group, i) => {
                                            const firstAppt = group[0];
                                            const startMinutes = timeToMinutes(firstAppt.time);
                                            const endMinutes = Math.max(...group.map(a => timeToMinutes(a.time) + (a.duration || 30)));
                                            const top = Math.max(0, (startMinutes - CALENDAR_START_HOUR * 60) / 60 * HOUR_HEIGHT);
                                            const height = Math.max(75, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT);
                                            
                                            if (group.length === 1) {
                                                const appointment = group[0];
                                                const tone = statusTone(appointment.status);
                                                const toneHex = { mint: "#34C759", sky: "#007AFF", amber: "#FF9500", coral: "#FF3B30", gray: "#8E8E93" } as Record<string, string>;
                                                const eventColor = toneHex[tone];
                                                
                                                return <button key={appointment.id} onClick={() => openReschedule(appointment)} className="absolute overflow-hidden rounded-xl border bg-white/95 backdrop-blur-md px-2.5 pt-2 pb-3 text-left shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all hover:z-50 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl group" style={{ top, height, left: '4px', width: 'calc(100% - 8px)', zIndex: 10, borderColor: eventColor, borderWidth: "1px" }} title="Reschedule appointment">
                                                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5">{formatTime(appointment.time)} - {formatTime(`${String((startMinutes + (appointment.duration || 30)) / 60 | 0).padStart(2, "0")}:${String((startMinutes + (appointment.duration || 30)) % 60).padStart(2, "0")}`)}</span>
                                                    <strong className="block truncate text-xs text-gray-800 mt-1">{patientName(appointment.patient_id)}</strong>
                                                    <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                                                        <span className="truncate text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors">
                                                            {appointment.doctor_id}
                                                        </span>
                                                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide bg-gray-50 text-gray-800 border border-gray-200 capitalize">
                                                            <TagIcon size={10} className="text-gray-400" />
                                                            {appointment.type || "new visit"}
                                                        </span>
                                                    </div>
                                                </button>;
                                            }
                                            
                                            return (
                                                <Popover key={`group-${i}`} trigger="hover" placement="right" content={
                                                    <div className="flex flex-col gap-2 p-1 min-w-[180px]">
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Appointment</div>
                                                        {group.map(a => {
                                                            const tone = statusTone(a.status);
                                                            const toneHex = { mint: "#34C759", sky: "#007AFF", amber: "#FF9500", coral: "#FF3B30", gray: "#8E8E93" } as Record<string, string>;
                                                            return (
                                                                <div key={a.id} onClick={() => openReschedule(a)} className="cursor-pointer hover:bg-gray-50 p-2.5 rounded-lg border transition-colors shadow-sm" style={{ borderColor: toneHex[tone], borderWidth: "1px" }}>
                                                                    <div className="text-xs font-extrabold text-gray-800">{formatTime(a.time)} - {patientName(a.patient_id)}</div>
                                                                    <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><span className="inline-flex items-center gap-1 capitalize"><TagIcon size={10} className="text-gray-400" />{a.type || "new visit"}</span> • {a.doctor_id}</div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                }>
                                                    <div className="absolute overflow-hidden rounded-xl border border-gray-200 bg-gray-50/95 backdrop-blur-md flex flex-col items-center justify-center shadow-sm cursor-pointer hover:bg-white hover:border-primary/30 hover:shadow-md transition-all z-20 group" style={{ top, height, left: '4px', width: 'calc(100% - 8px)' }}>
                                                        <div className="text-center p-2">
                                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse delay-75"></div>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse delay-150"></div>
                                                            </div>
                                                            <div className="text-xs font-bold text-gray-700 group-hover:text-primary transition-colors">{group.length} Appointments</div>
                                                            <div className="text-[10px] text-gray-500 mt-1">{formatTime(firstAppt.time)} - {formatTime(`${String(endMinutes / 60 | 0).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`)}</div>
                                                        </div>
                                                    </div>
                                                </Popover>
                                            );
                                        });
                                    })()}
                                    </div>;
                                })}
                            </div>
                        </div>
                        </div>
                    )}
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm overflow-x-auto">
                    <Table dataSource={appointments} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} size="small" scroll={{ x: 900 }} />
                </div>
            </motion.div>

            <Modal title="Schedule appointment" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null} destroyOnHidden>
                <Form form={createForm} layout="vertical" onFinish={handleSchedule} initialValues={{ duration: 30, type: "new visit" }}>
                    <Form.Item name="patient_id" label="Patient" rules={[{ required: true, message: "Select a patient" }]}><Select showSearch optionFilterProp="label" options={patients.map((patient) => ({ value: patient.id, label: patient.name }))} placeholder="Select patient" /></Form.Item>
                    <div className="flex gap-2 items-end">
                        <Form.Item name="doctor_id" label="Doctor" rules={[{ required: true, message: "Select a doctor" }]} className="flex-1">
                            <Select showSearch optionFilterProp="label" options={doctors.map(d => ({ value: d.name, label: d.name }))} placeholder="Select doctor" />
                        </Form.Item>
                        <Form.Item>
                            <Button onClick={() => setIsAddDoctorOpen(true)} icon={<Plus size={16} />} title="Add new doctor" />
                        </Form.Item>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Form.Item name="date" label="Date" rules={[{ required: true, message: "Enter a date" }]}><Input type="date" /></Form.Item>
                        <Form.Item name="time" label="Time" rules={[{ required: true, message: "Enter a time" }]}><Input type="time" min="08:00" max="23:30" /></Form.Item>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Form.Item name="duration" label="Duration (minutes)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="type" label="Appointment type" rules={[{ required: true }]}><Select options={[{ value: "new visit", label: "New visit" }, { value: "follow-up", label: "Follow-up" }]} /></Form.Item>
                    </div>
                    <Form.Item name="reason" label="Reason for appointment">
                        <Input placeholder="e.g. Annual checkup, consultation..." />
                    </Form.Item>

                    <div className="flex justify-end gap-3"><Button onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={saving}>Schedule</Button></div>
                </Form>
            </Modal>

            <Modal title="Reschedule appointment" open={Boolean(rescheduling)} onCancel={() => setRescheduling(null)} footer={null} destroyOnHidden>
                <Form form={rescheduleForm} layout="vertical" onFinish={handleReschedule}>
                    <Form.Item name="date" label="New date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
                    <Form.Item name="time" label="New time" rules={[{ required: true }]}><Input type="time" min="08:00" max="23:30" /></Form.Item>

                    <div className="flex justify-end gap-3"><Button onClick={() => setRescheduling(null)}>Cancel</Button><Button type="primary" htmlType="submit" loading={saving}>Reschedule</Button></div>
                </Form>
            </Modal>
        
            <Modal title="Add new doctor" style={{ top: 150 }} open={isAddDoctorOpen} onCancel={() => setIsAddDoctorOpen(false)} footer={null} destroyOnHidden>
                <Form form={doctorForm} layout="vertical" onFinish={handleAddDoctor}>
                    <Form.Item name="name" label="Doctor Name" rules={[{ required: true }]}><Input placeholder="e.g. Dr. Sarah Lee" /></Form.Item>
                    <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]} tooltip="Include country code (e.g. +1234567890)"><Input placeholder="+1234567890" /></Form.Item>
                    <div className="flex justify-end gap-3"><Button onClick={() => setIsAddDoctorOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={saving}>Add Doctor</Button></div>
                </Form>
            </Modal>
        </div>
    );
}
