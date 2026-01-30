"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Leaf, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

export default function CustomerLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Update last login
        await supabase
          .from("customers")
          .update({ last_login: new Date().toISOString() })
          .eq("id", data.user.id);

        toast({
          title: "Success",
          description: "Logged in successfully!",
        });

        router.push("/customer/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] py-12 px-4 sm:py-16 sm:px-6">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-2 border-green-100 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            {/* Logo/Brand Section */}
            <div className="flex flex-col items-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative h-16 w-16 rounded-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center shadow-lg overflow-hidden"
              >
                <Image src="/icons/dakshamani_logo.png" alt="Dakshamani Logo" width={64} height={64} className="object-contain p-2" />
              </motion.div>
              <div className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Sign in to your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-green-600" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4 text-green-600" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none rounded p-1"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Register Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-2"
              >
                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/customer/register"
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    Create Account
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
