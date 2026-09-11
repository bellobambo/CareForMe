"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ClipboardList, CalendarCheck, MessageSquare, Activity, ShieldAlert, CheckCircle } from "lucide-react";

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="logo-cross w-10 h-10 shrink-0" aria-label="CareForMe logo">
            <span /><span /><span /><span />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">CareForMe</h1>
        </div>
        <div className="flex items-center gap-4 md:gap-8 text-gray-600 font-bold text-sm md:text-base">
          <Link href="/" className="hidden md:block hover:text-primary transition-colors">Home</Link>
          <Link href="/about" className="hidden md:block hover:text-primary transition-colors">About Us</Link>
          <Link href="/how-to-use" className="hidden md:block text-primary transition-colors">How to Use</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          <Link href="/register" className="bg-primary text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap">
            Register Clinic
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            How CareForMe Works
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Discover the seamless end-to-end user flow that empowers your clinic to automate administrative tasks while ensuring optimal patient care.
          </p>
        </motion.div>

        <div className="space-y-16 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-primary-light text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <ClipboardList size={24} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-6 rounded-[2rem] border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl text-gray-900 mb-2">1. Clinic Onboarding & Setup</h3>
              <p className="text-gray-600 leading-relaxed">
                Start by registering your clinic on our platform. Once logged in, your administrative staff gains access to a comprehensive dashboard. CareForMe seamlessly connects to your DynamoDB backend, immediately syncing schedules, patient records, and available slots without any complex technical configurations.
              </p>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-primary-light text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <CalendarCheck size={24} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-6 rounded-[2rem] border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl text-gray-900 mb-2">2. Autonomous Scheduling</h3>
              <p className="text-gray-600 leading-relaxed">
                Say goodbye to phone tag. CareForMe's AI agent continuously monitors your calendar. When a slot opens up or an appointment is needed, the system automatically coordinates bookings and reschedules appointments based on real-time availability.
              </p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-primary-light text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <MessageSquare size={24} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-6 rounded-[2rem] border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl text-gray-900 mb-2">3. Patient Communication</h3>
              <p className="text-gray-600 leading-relaxed">
                Patients receive automated, natural-sounding SMS text notifications regarding their upcoming appointments. They can easily reply with "1" to confirm or "3" to cancel. The agent processes these replies instantly, updating your database and freeing up slots if necessary.
              </p>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-red-100 text-red-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <ShieldAlert size={24} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-6 rounded-[2rem] border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl text-gray-900 mb-2">4. Clinical Escalation & Safety</h3>
              <p className="text-gray-600 leading-relaxed">
                Safety is paramount. CareForMe acts strictly as an administrative assistant and will never dispense medical advice. If a patient replies with symptom complaints or critical health issues, the AI immediately halts automated communication and flags a high-priority task for your medical staff on the dashboard.
              </p>
            </div>
          </motion.div>

          {/* Step 5 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-primary-light text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <Activity size={24} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-6 rounded-[2rem] border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl text-gray-900 mb-2">5. Agent Chat & Bulk Tasks</h3>
              <p className="text-gray-600 leading-relaxed">
                Clinic staff aren't left in the dark. Through the dashboard, staff can chat directly with the Strands Agent powered by Amazon Nova Lite. Ask the agent to chase down no-shows, perform bulk administrative tasks, or summarize the day's schedules—saving hours of manual labor.
              </p>
            </div>
          </motion.div>

          {/* Step 6 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-gray-900 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <CheckCircle size={24} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-900 text-white p-6 rounded-[2rem] border border-gray-800 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl text-white mb-2">6. Transparent Auditing</h3>
              <p className="text-gray-400 leading-relaxed">
                Trust is built on transparency. Every action taken, message sent, and database record modified by the agent is logged. Staff can review these verifiable actions in the Audit Log, ensuring complete oversight of the clinic's operations.
              </p>
            </div>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 text-center"
        >
          <Link href="/register">
            <button className="bg-primary text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-primary/90 shadow-lg transition-transform hover:scale-105 active:scale-95">
              Get Started with CareForMe
            </button>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 text-center text-gray-400 border-t border-gray-100 mt-20">
        <p>© 2026 CareForMe. Built for the AWS Agents for Humans Hackathon.</p>
      </footer>
    </div>
  );
}
