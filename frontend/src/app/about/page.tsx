"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, HeartPulse, Building2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="logo-cross w-10 h-10" aria-label="CareForMe logo">
            <span /><span /><span /><span />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">CareForMe</h1>
        </div>
        <div className="flex items-center gap-8 text-gray-600 font-bold">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/about" className="text-primary transition-colors">About Us</Link>
          <Link href="/dashboard" className="bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
            Clinic Login
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Building the Future of <br className="hidden md:block" /> Healthcare Administration
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            CareForMe was built for the AWS Hackathon to solve a critical problem in small outpatient clinics: administrative burnout.
          </p>
        </motion.div>

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-8 items-start bg-gray-50 p-8 rounded-[2rem] border border-gray-100"
          >
            <div className="w-16 h-16 shrink-0 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
              <HeartPulse size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                Doctors and nurses should spend their time treating patients, not playing phone tag to reschedule missed appointments. We believe AI agents can safely and autonomously handle the logistical overhead of running a clinic, provided they have strict boundaries preventing them from giving medical advice.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-8 items-start bg-gray-50 p-8 rounded-[2rem] border border-gray-100"
          >
            <div className="w-16 h-16 shrink-0 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
              <Building2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">The Architecture</h3>
              <p className="text-gray-600 leading-relaxed">
                CareForMe is powered by Amazon Bedrock and the Strands Agent SDK. It operates via an EventBridge-simulated webhook that triggers a background Python worker. This worker autonomously queries Amazon DynamoDB to fetch patient records, read calendar availability, and book appointments without ever requiring a human to initiate a chat.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <Link href="/dashboard">
            <button className="bg-gray-900 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-gray-800 shadow-lg transition-transform hover:scale-105 active:scale-95">
              Experience the Dashboard
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
