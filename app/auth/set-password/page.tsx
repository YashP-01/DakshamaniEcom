"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

// This page must be dynamic as it handles auth callbacks
export const dynamic = 'force-dynamic';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get user info from the invite token
    const checkInvite = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        setEmail(user.email);
      }
    };

    checkInvite();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Update user password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password set successfully! Redirecting to login...",
      });

      // Sign out and redirect to admin login
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Set Your Password
          </CardTitle>
          {email && (
            <p className="text-center text-sm text-gray-600 mt-2">
              for {email}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting Password..." : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
