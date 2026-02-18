import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useAdminAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        setIsLoading(false);
        return;
      }

      // Check if user is admin (legacy system)
      const { data: customerData } = await supabase
        .from("customers")
        .select("is_admin, is_active")
        .eq("id", user.id)
        .single();

      // Legacy admin check (backward compatible)
      if (customerData?.is_admin && customerData.is_active) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Fallback: Check if user has any store assignments (new RBAC system)
      const { data: assignments, error: assignmentError } = await supabase
        .from("user_store_assignments")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!assignmentError && assignments && assignments.length > 0) {
        // User has role assignments, allow access
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // No admin access - sign out and redirect
      await supabase.auth.signOut();
      router.push("/admin/login");
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, isLoading };
}










