"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PERMISSION_GROUPS, PERMISSION_LABELS, type AppPermission } from "@/lib/rbac/types";
import { Check } from "lucide-react";

interface PermissionSelectorProps {
  selectedPermissions: AppPermission[];
  onChange: (permissions: AppPermission[]) => void;
  disabled?: boolean;
}

// Simple custom checkbox since components/ui/checkbox.tsx doesn't exist yet
function SimpleCheckbox({ 
  checked, 
  onCheckedChange, 
  disabled, 
  id 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`
        peer h-5 w-5 shrink-0 rounded border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50
        flex items-center justify-center transition-colors
        ${checked ? "bg-green-600 border-green-600 text-white" : "bg-white hover:bg-gray-50"}
      `}
      id={id}
    >
      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </button>
  );
}

export function PermissionSelector({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionSelectorProps) {
  const handleToggle = (permission: AppPermission, checked: boolean) => {
    if (checked) {
      onChange([...selectedPermissions, permission]);
    } else {
      onChange(selectedPermissions.filter((p) => p !== permission));
    }
  };

  const handleGroupToggle = (permissions: AppPermission[], checked: boolean) => {
    if (checked) {
      // Add all permissions in group that aren't already selected
      const toAdd = permissions.filter((p) => !selectedPermissions.includes(p));
      onChange([...selectedPermissions, ...toAdd]);
    } else {
      // Remove all permissions in group
      onChange(selectedPermissions.filter((p) => !permissions.includes(p)));
    }
  };

  // Helper to check if all permissions in a group are selected
  const isGroupSelected = (groupPermissions: AppPermission[]) => {
    return groupPermissions.every((p) => selectedPermissions.includes(p));
  };
  
  // Helper to check if some (but not all) permissions in a group are selected
  const isGroupIndeterminate = (groupPermissions: AppPermission[]) => {
    const selectedCount = groupPermissions.filter((p) => selectedPermissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < groupPermissions.length;
  };

  return (
    <div className="space-y-6">
      {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
        const allSelected = isGroupSelected(group.permissions);
        const indeterminate = isGroupIndeterminate(group.permissions);

        return (
          <Card key={key} className="border border-green-100 shadow-sm">
            <CardHeader className="bg-green-50/30 pb-3 pt-4">
              <div className="flex items-center space-x-2">
                <SimpleCheckbox
                  id={`group-${key}`}
                  checked={allSelected}
                  onCheckedChange={(checked) => handleGroupToggle(group.permissions, checked)}
                  disabled={disabled}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={`group-${key}`}
                    className="text-base font-semibold text-green-800 cursor-pointer"
                  >
                    {group.label}
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {group.permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-start space-x-2 rounded-md border border-transparent p-2 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                >
                  <SimpleCheckbox
                    id={permission}
                    checked={selectedPermissions.includes(permission)}
                    onCheckedChange={(checked) => handleToggle(permission, checked)}
                    disabled={disabled}
                  />
                  <div className="grid gap-1.5 leading-none pt-0.5">
                    <Label
                      htmlFor={permission}
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {PERMISSION_LABELS[permission]}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {permission}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
