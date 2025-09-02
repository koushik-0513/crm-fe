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
import { Check, X, Users, Building2 } from "lucide-react";

export function JoinTeamDialog() {
  const [open, setOpen] = useState(false);
  const [teamCode, setTeamCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teamInfo, setTeamInfo] = useState<{ name: string; adminName: string } | null>(null);
  const { user } = useAuth();
  const { data: userProfile, refetch } = useUserProfile();

  const validateTeamCode = async (code: string) => {
    try {
      const token = await user?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return false;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate-team-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamCode: code }),
      });

      if (response.ok) {
        const data = await response.json();
        setTeamInfo(data.data);
        return true;
      } else {
        setTeamInfo(null);
        return false;
      }
    } catch (error) {
      console.error("Error validating team code:", error);
      setTeamInfo(null);
      return false;
    }
  };

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      toast.error("Please enter a team code");
      return;
    }

    if (!teamInfo) {
      toast.error("Please validate the team code first");
      return;
    }

    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamCode: teamCode.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully joined ${data.data.teamName}!`);
        setOpen(false);
        setTeamCode("");
        setTeamInfo(null);
        // Refresh user profile to reflect changes
        await refetch();
        // Force page reload to update all components
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to join team");
      }
    } catch (error) {
      console.error("Error joining team:", error);
      toast.error("Failed to join team");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for users without a team
  if (userProfile?.teamCode) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Join Team</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Join Existing Team</span>
          </DialogTitle>
          <DialogDescription>
            Enter the team code provided by your administrator to join their organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="teamCode" className="text-sm font-medium text-gray-700">
              Team Code *
            </label>
            <Input
              id="teamCode"
              type="text"
              placeholder="Enter 6-character team code"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              className="w-full font-mono text-center text-lg"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-500 text-center">
              Team codes are 6 characters long (letters and numbers)
            </p>
          </div>

          {teamCode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => validateTeamCode(teamCode)}
              className="w-full"
            >
              Validate Team Code
            </Button>
          )}

          {teamInfo && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 text-green-700">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Valid team code!</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Team: {teamInfo.name} | Admin: {teamInfo.adminName}
              </p>
            </div>
          )}

          {teamCode && !teamInfo && teamCode.length >= 6 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 text-red-700">
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Invalid team code</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Please check the code and try again
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinTeam}
              disabled={!teamInfo || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </span>
              ) : (
                "Join Team"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
