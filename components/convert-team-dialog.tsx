"use client";

import { useState } from "react";
import { Button } from "@/hooks/utils/common-imports";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/hooks/utils/common-imports";
import { Input } from "@/hooks/utils/common-imports";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/apis/user-service";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";

export function ConvertTeamDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { data: userProfile, refetch } = useUserProfile();

  const handleConvertTeam = async () => {
    if (!userProfile?.teamCode) {
      toast.error("No team code found");
      return;
    }

    if (confirmText !== "CONVERT TEAM") {
      toast.error("Please type 'CONVERT TEAM' to confirm");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/convert-team-to-individual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamCode: userProfile.teamCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully converted ${data.data.convertedCount} users to individuals`);
        setOpen(false);
        setConfirmText("");
        // Refresh user profile to reflect changes
        await refetch();
        // Force page reload to update all components
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to convert team");
      }
    } catch (error) {
      console.error("Error converting team:", error);
      toast.error("Failed to convert team");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for admin users with a team
  if (userProfile?.role !== "admin" || !userProfile?.teamCode) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Dissolve Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Dissolve Organization
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <p>
              <strong>Warning:</strong> This action will permanently dissolve your organization and convert all team members to individual users.
            </p>
            <p>
              <strong>Effects:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All team members will lose access to team chat</li>
              <li>Organization name and team code will be removed</li>
              <li>All users will become individual accounts</li>
              <li>This action cannot be undone</li>
            </ul>
            <p className="text-red-600 font-medium">
              Team Code: <code className="bg-gray-100 px-1 rounded">{userProfile?.teamCode}</code>
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="confirm-text" className="text-sm font-medium">
              Type <strong>CONVERT TEAM</strong> to confirm:
            </label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONVERT TEAM"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setConfirmText("");
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConvertTeam}
            disabled={isLoading || confirmText !== "CONVERT TEAM"}
          >
            {isLoading ? "Converting..." : "Dissolve Organization"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
