"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { signIn, signOut, fetchAuthSession } from "aws-amplify/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Force clear any stuck session before attempting to sign in
      try {
        await signOut();
      } catch (e) {
        // ignore
      }

      // 1. AWS Cognito Login
      const { isSignedIn, nextStep } = await signIn({
        username: formData.email,
        password: formData.password
      });
      
      if (!isSignedIn) {
        if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          throw new Error("Please check your email and verify your account before logging in!");
        } else if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          throw new Error("You must reset your temporary password.");
        } else {
          throw new Error(`Login requires additional steps: ${nextStep?.signInStep}`);
        }
      }

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      // Store the real AWS Cognito JWT token for API calls
      if (typeof window !== "undefined" && token) {
        localStorage.setItem("careforme_token", token);
      }

      /* --- MOCK LOGIN FOR DEVELOPMENT (Commented out) ---
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clinics/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      if (typeof window !== "undefined") {
        localStorage.setItem("careforme_token", response.data.access_token);
      }
      -------------------------------------------------- */

      toast.success("Welcome back!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to log in. Check credentials.");
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
          Clinic Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
            register a new clinic
          </Link>
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-[2rem] sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-xl p-3 bg-gray-50 border outline-none transition-all" placeholder="admin@yourclinic.com" />
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

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary/80">Forgot your password?</a>
              </div>
            </div>

            <div>
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70">
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight size={18} />}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
