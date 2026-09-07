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
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">CareForMe</h1>
        </div>
        <div className="flex items-center gap-8 text-gray-600 font-bold">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
          <Link href="/dashboard" className="bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
            Clinic Login
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
            Stop wasting hours on administrative phone calls. CareForMe silently coordinates follow-ups, reschedules appointments, and flags critical issues—so you can focus on patient care.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-white font-bold text-lg px-8 py-4 rounded-full flex items-center gap-2 shadow-lg shadow-primary/30"
              >
                Access Dashboard <ArrowRight size={20} />
              </motion.button>
            </Link>
            <Link href="/about">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-50 text-gray-800 font-bold text-lg px-8 py-4 rounded-full border border-gray-200 hover:border-gray-300"
              >
                Learn More
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
          <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Automated Follow-ups</h3>
            <p className="text-gray-500">Events trigger the agent to coordinate routine follow-up tasks without human intervention.</p>
          </div>
          <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
              <Bot size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Autonomous Loop</h3>
            <p className="text-gray-500">Agent connects directly to DynamoDB to check schedules and book appointments instantly.</p>
          </div>
          <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 mb-6 shadow-sm">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Clinical Escalation</h3>
            <p className="text-gray-500">Strict safety boundaries ensure any medical complaints are immediately escalated to human doctors.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
