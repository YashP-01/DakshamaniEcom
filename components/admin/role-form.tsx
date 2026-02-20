"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";  
import { PermissionSelector } from "@/components/admin/permission-selector";
import { type AppPermission, type CreateRoleInput, type CustomRoleWithPermissions } from "@/lib/rbac/types";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RoleFormProps {
  storeId: string;
  initialData?: CustomRoleWithPermissions | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoleForm({
  storeId,
  initialData,
  onSuccess,
  onCancel,
}: RoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateRoleInput>({
    store_id: storeId,
    name: "",
    description: "",
    permissions: [],
  });

  // Load initial data if provided (edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        store_id: initialData.store_id,
        name: initialData.name,
        description: initialData.description || "",
        permissions: initialData.permissions.map((p) => p.permission),
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.permissions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one permission",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      if (initialData) {
        // UPDATE existing role
        // 1. Update role details
        const { error: roleError } = await supabase
          .from("custom_roles")
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id);

        if (roleError) throw roleError;

        // 2. Update permissions (delete all and re-insert is simplest for now)
        // Optimization: In a real app, calculate diffs to avoid churn
        
        // Delete existing permissions
        const { error: deleteError } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", initialData.id);

        if (deleteError) throw deleteError;

        // Insert new permissions
        const permissionRows = formData.permissions.map((p) => ({
          role_id: initialData.id,
          permission: p,
        }));

        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(permissionRows);

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Role updated successfully",
        });

      } else {
        // CREATE new role
        // 1. Insert role
        const { data: role, error: roleError } = await supabase
          .from("custom_roles")
          .insert({
            store_id: storeId,
            name: formData.name,
            description: formData.description,
          })
          .select()
          .single();

        if (roleError) throw roleError;

        // 2. Insert permissions
        const permissionRows = formData.permissions.map((p) => ({
          role_id: role.id,
          permission: p,
        }));

        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(permissionRows);

        if (permError) throw permError;

        toast({
          title: "Success",
          description: "Role created successfully",
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh(); // Refresh server components
      }
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-base">
            Role Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. Orders Manager"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
            className="text-lg py-6"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description" className="text-base">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe what this role allows users to do..."
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
            className="resize-none min-h-[100px]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base text-green-800 font-semibold">
          Permissions <span className="text-red-500">*</span>
        </Label>
        <div className="rounded-lg border bg-gray-50/50 p-6">
          <PermissionSelector
            selectedPermissions={formData.permissions}
            onChange={(permissions) =>
              setFormData({ ...formData, permissions })
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 min-w-[150px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {initialData ? "Update Role" : "Create Role"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
