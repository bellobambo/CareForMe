"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Building, Mail, MapPin, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { signUp, confirmSignUp, signOut } from "aws-amplify/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    admin_email: "",
    password: "",
    location: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Force clear any stuck session before attempting to sign up
      try {
        await signOut();
      } catch (e) {
        // ignore
      }

      // 1. Register clinic in backend FIRST (checks for duplicate email)
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clinics/register`, {
        name: formData.name,
        admin_email: formData.admin_email,
        location: formData.location
      });

      // 2. Only if backend succeeds, create Cognito user
      const uniqueUsername = crypto.randomUUID();
      setGeneratedUsername(uniqueUsername);
      
      await signUp({
        username: uniqueUsername,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.admin_email
          }
        }
      });
      
      toast.success("Clinic registered! We sent a verification code to your email.");
      setStep(2);
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.detail || error.message || "Failed to register clinic. Please try again.";
      toast.error(message);
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmSignUp({
        username: generatedUsername,
        confirmationCode: otpCode
      });

      toast.success("Account verified successfully! You can now log in.");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Invalid verification code.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0 mb-6 cursor-pointer">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-red-500 rounded-[1px]"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-red-500 rounded-[1px]"></div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-1.5 bg-red-500 rounded-[1px]"></div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-1.5 bg-red-500 rounded-[1px]"></div>
          </div>
        </Link>
        
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {step === 1 ? "Register your Clinic" : "Verify your Email"}
        </h2>
        
        {step === 1 && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              log in to your existing account
            </Link>
          </p>
        )}
        
        {step === 2 && (
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a 6-digit code to <span className="font-bold text-gray-800">{formData.admin_email}</span>
          </p>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-[2rem] sm:px-10 border border-gray-100">
          
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRegisterSubmit}>
              
              {/* Clinic Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Clinic Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Building size={18} />
                  </div>
                  <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-xl p-3 bg-gray-50 border outline-none transition-all" placeholder="e.g. Downtown Health Clinic" />
                </div>
              </div>

              {/* Admin Email */}
              <div>
                <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700">Admin Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input id="admin_email" name="admin_email" type="email" required value={formData.admin_email} onChange={handleChange} className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-xl p-3 bg-gray-50 border outline-none transition-all" placeholder="admin@yourclinic.com" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} className="focus:ring-primary focus:border-primary block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-xl p-3 bg-gray-50 border outline-none transition-all" placeholder="••••••••" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Clinic Location</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={18} />
                  </div>
                  <input id="location" name="location" type="text" required value={formData.location} onChange={handleChange} className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-xl p-3 bg-gray-50 border outline-none transition-all" placeholder="e.g. 123 Wellness Ave, NY" />
                </div>
              </div>

              <div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70">
                  {loading ? "Registering..." : "Create Clinic Account"}
                  {!loading && <ArrowRight size={18} />}
                </motion.button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerificationSubmit}>
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">Verification Code</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={18} />
                  </div>
                  <input id="otpCode" name="otpCode" type="text" required value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-xl p-3 bg-gray-50 border outline-none transition-all tracking-widest font-mono" placeholder="123456" />
                </div>
              </div>
              
              <div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70">
                  {loading ? "Verifying..." : "Verify & Continue"}
                  {!loading && <ArrowRight size={18} />}
                </motion.button>
              </div>
              
              <div className="text-center">
                <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                  Back to Registration
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
