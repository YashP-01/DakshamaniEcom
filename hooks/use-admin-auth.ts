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

      // Check if user is admin
      const { data: customerData } = await supabase
        .from("customers")
        .select("is_admin, is_active")
        .eq("id", user.id)
        .single();

      if (!customerData || !customerData.is_admin || !customerData.is_active) {
        await supabase.auth.signOut();
        router.push("/admin/login");
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, isLoading };
}










