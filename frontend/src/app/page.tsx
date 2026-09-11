"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Bot, Clock, ShieldAlert } from "lucide-react";

export default function LandingPage() {
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
        <div className="flex items-center gap-8 text-gray-600 font-bold">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          <Link href="/register" className="bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm">
            Register Clinic
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-full font-bold text-sm mb-8">
            <Bot size={16} /> Powered by Strands Agents & AWS Bedrock
          </div>

          <h2 className="text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
            The Autonomous Agent for <br />
            <span className="text-primary">Clinic Operations.</span>
          </h2>

          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop wasting hours on administrative phone calls. CareForMe silently coordinates follow-ups, reschedules appointments, and flags critical issues so you can focus on patient care.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-white font-bold text-lg px-8 py-4 rounded-full flex items-center gap-2 shadow-lg shadow-primary/30"
              >
                Register your Clinic <ArrowRight size={20} />
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-50 text-gray-800 font-bold text-lg px-8 py-4 rounded-full border border-gray-200 hover:border-gray-300"
              >
                Clinic Login
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left"
        >
          <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Automated Follow-ups</h3>
            <p className="text-gray-500">Events trigger the agent to coordinate routine follow-up tasks without human intervention, checking past appointments and sending SMS text messages to patients.</p>
          </div>
          <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
              <Bot size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Autonomous Loop</h3>
            <p className="text-gray-500">Agent connects directly to DynamoDB to check schedules, find available slots, and book or reschedule appointments instantly through real backend tools.</p>
          </div>
          <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 mb-6 shadow-sm">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Clinical Escalation</h3>
            <p className="text-gray-500">Strict safety boundaries ensure the agent never gives medical advice. Any symptom complaints are immediately escalated to human doctors via a dashboard task.</p>
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 w-full text-left bg-gray-900 text-white p-12 md:p-16 rounded-[3rem]"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-6">Built for the Real World</h2>
            <p className="text-lg text-gray-400">CareForMe bridges the gap between powerful AI and necessary human oversight. Here is how it keeps your clinic running smoothly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-primary font-bold text-lg mb-2">01. Smart Scheduling</h4>
              <p className="text-gray-400">Patients receive automated SMS text notifications for their appointments. They can reply 1 to confirm or 3 to cancel, directly updating the DynamoDB backend without staff lifting a finger.</p>
            </div>
            <div>
              <h4 className="text-primary font-bold text-lg mb-2">02. Strands Agent AI</h4>
              <p className="text-gray-400">Staff can chat with the Amazon Nova Lite powered Strands Agent to perform bulk administrative tasks, or let it run autonomously on a schedule to chase down no-shows and handle re-bookings.</p>
            </div>
            <div>
              <h4 className="text-primary font-bold text-lg mb-2">03. Verifiable Actions</h4>
              <p className="text-gray-400">Every action the AI takes is recorded in a transparent Audit Log on your dashboard. No black boxes. You see exactly what tools were called and what data was changed.</p>
            </div>
            <div>
              <h4 className="text-primary font-bold text-lg mb-2">04. Safety-Bounded</h4>
              <p className="text-gray-400">CareForMe is an administrative assistant, not a doctor. By design, it delegates clinical decisions back to humans, ensuring patient safety remains uncompromised.</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 text-center text-gray-400 border-t border-gray-100 mt-20">
        <p>© 2026 CareForMe. Built for the AWS Agents for Humans Hackathon.</p>
      </footer>
    </div>
  );
}
