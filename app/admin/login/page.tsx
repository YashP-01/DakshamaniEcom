"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Login failed");
      }

      // Check if user is admin
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("is_admin, is_active")
        .eq("id", authData.user.id)
        .single();

      if (customerError) {
        // Customer profile might not exist, create it
        const { error: createError } = await supabase
          .from("customers")
          .insert({
            id: authData.user.id,
            email: authData.user.email || email,
            is_admin: false, // Will be set manually in database
            is_active: true,
          });

        if (createError) {
          throw new Error("Failed to create customer profile");
        }

        throw new Error("You don't have admin access. Please contact administrator.");
      }

      if (!customerData.is_admin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        throw new Error("You don't have admin access. Please contact administrator.");
      }

      if (!customerData.is_active) {
        await supabase.auth.signOut();
        throw new Error("Your admin account is inactive. Please contact administrator.");
      }

      // Update last login
      await supabase
        .from("customers")
        .update({ last_login: new Date().toISOString() })
        .eq("id", authData.user.id);

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      router.push("/admin/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

