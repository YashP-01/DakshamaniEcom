"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Shield, 
  Edit, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RoleForm } from "@/components/admin/role-form";
import { CustomRoleWithPermissions } from "@/lib/rbac/types";

export default function AdminRolesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [roles, setRoles] = useState<CustomRoleWithPermissions[]>([]);
  const [isLegacyAdmin, setIsLegacyAdmin] = useState(false);
  
  // Dialog state
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRoleWithPermissions | null>(null);

  useEffect(() => {
    checkAuthAndLoadStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadRoles(selectedStoreId);
    }
  }, [selectedStoreId]);

  const checkAuthAndLoadStores = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Check admin status directly from customers table (no JWT hook needed)
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("is_admin, is_active")
        .eq("id", user.id)
        .single();

      const isAdmin = customerData?.is_admin && customerData?.is_active;
      setIsLegacyAdmin(!!isAdmin);

      let storeIds: string[] = [];

      if (isAdmin) {
        // Legacy admin: fetch all active stores directly
        const { data: allStores, error: storeError } = await supabase
          .from("stores")
          .select("id, name")
          .eq("is_active", true)
          .order("name");

        if (storeError) throw storeError;

        if (allStores && allStores.length > 0) {
          setStores(allStores);
          setSelectedStoreId(allStores[0].id);
        } else {
          toast({
            title: "No Stores Found",
            description: "No active stores found in the system.",
            variant: "destructive",
          });
        }
      } else {
        // RBAC user: check user_store_assignments
        const { data: assignments, error: assignError } = await supabase
          .from("user_store_assignments")
          .select("store_id, system_role")
          .eq("user_id", user.id);

        if (assignError || !assignments || assignments.length === 0) {
          toast({
            title: "Access Denied",
            description: "You don't have access to any stores.",
            variant: "destructive",
          });
          router.push("/admin/dashboard");
          return;
        }

        storeIds = assignments.map(a => a.store_id);

        // Fetch details for those stores
        const { data: storesData, error: storeErr } = await supabase
          .from("stores")
          .select("id, name")
          .in("id", storeIds)
          .eq("is_active", true)
          .order("name");

        if (storeErr) throw storeErr;

        if (storesData && storesData.length > 0) {
          setStores(storesData);
          setSelectedStoreId(storesData[0].id);
        } else {
          toast({
            title: "Error",
            description: "Could not load store details.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Auth check error:", error);
      toast({
        title: "Error",
        description: "Failed to initialize page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async (storeId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("custom_roles")
        .select(`
          *,
          permissions:role_permissions(
            id,
            role_id,
            permission
          )
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error loading roles:", JSON.stringify(error));
        throw error;
      }

      setRoles((data as CustomRoleWithPermissions[]) || []);
    } catch (error: any) {
      console.error("Error loading roles:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load roles.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("custom_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      
      loadRoles(selectedStoreId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handleRoleSuccess = () => {
    setShowRoleDialog(false);
    setEditingRole(null);
    loadRoles(selectedStoreId);
  };

  if (loading) {
     return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
                <p className="text-sm text-gray-500">Manage custom roles for your store staff</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {stores.length > 1 && (
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button onClick={() => { setEditingRole(null); setShowRoleDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Role
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Helper Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800">System Roles vs Custom Roles</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Store Admin:</strong> Has full access to manage their assigned store. Cannot be modified.<br/>
              <strong>Custom Roles:</strong> Created by you to give specific permissions (e.g. "Order Manager", "Product Editor").
            </p>
          </div>
        </div>

        {roles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Custom Roles Yet</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
              Create roles to define what your staff members can see and do in the admin panel.
            </p>
            <Button className="mt-6" onClick={() => { setEditingRole(null); setShowRoleDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Role
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50/50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-800">{role.name}</CardTitle>
                      {role.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {role.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Custom
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Permissions ({role.permissions.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((p) => (
                        <span key={p.id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                          {p.permission.split('.')[0]}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                          +{role.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setEditingRole(role); setShowRoleDialog(true); }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Role Form Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              Define the permissions for this role.
            </DialogDescription>
          </DialogHeader>
          
          <RoleForm 
            storeId={selectedStoreId}
            initialData={editingRole}
            onSuccess={handleRoleSuccess}
            onCancel={() => setShowRoleDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
