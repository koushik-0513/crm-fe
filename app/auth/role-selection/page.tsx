"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/apis/user-service";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck, ArrowRight, Building2, Crown, Copy, Check, Users, X } from "lucide-react";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<"admin" | "user" | "individual" | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTeamCode, setShowTeamCode] = useState(false);
  const [generatedTeamCode, setGeneratedTeamCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [teamInfo, setTeamInfo] = useState<{ name: string; adminName: string } | null>(null);
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();
  const router = useRouter();

  console.log("RoleSelection component rendered, user:", user);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      console.log("No user in role selection, redirecting to login");
      router.push("/auth/login");
    }
  }, [user, router]);

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  const validateTeamCode = async (code: string) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/validate-team-code`, {
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

  const handleRoleSelect = async () => {
    if (!selectedRole || !user) return;

    // For admin role, organization name is required
    if (selectedRole === "admin" && !organizationName.trim()) {
      alert("Please enter your organization name");
      return;
    }

    // For team member role, team code is required
    if (selectedRole === "user" && !teamCode.trim()) {
      alert("Please enter a valid team code");
      return;
    }

    // For individual role, no additional fields required
    if (selectedRole === "individual") {
      // Individual users don't need team code or organization name
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/update-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: selectedRole,
          organizationName: organizationName.trim() || undefined,
          teamCode: teamCode.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      const data = await response.json();

      // Invalidate user profile query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });

      if (selectedRole === "admin" && data.data?.user?.teamCode) {
        setGeneratedTeamCode(data.data.user.teamCode);
        setShowTeamCode(true);
      } else if (selectedRole === "user") {
        console.log("Team member role updated successfully, redirecting to dashboard");
        router.push("/dashboard");
      } else if (selectedRole === "individual") {
        console.log("Individual role updated successfully, redirecting to dashboard");
        router.push("/dashboard");
      } else {
        console.log("Role updated successfully, redirecting to dashboard");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyTeamCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedTeamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy team code:", error);
    }
  };

  const continueToDashboard = () => {
    router.push("/dashboard");
  };

  const roles = [
    {
      id: "admin" as const,
      title: "Administrator",
      description: "Create and manage your own team",
      icon: Crown,
      features: [
        "Create new team",
        "Full system access",
        "Team member management",
        "System configuration"
      ],
      color: "bg-purple-500",
      badge: "Team Creator"
    },
    {
      id: "user" as const,
      title: "Team Member",
      description: "Join an existing team",
      icon: Users,
      features: [
        "Join existing team",
        "Contact management",
        "Team collaboration",
        "Basic reporting"
      ],
      color: "bg-blue-500",
      badge: "Team Member"
    },
    {
      id: "individual" as const,
      title: "Individual User",
      description: "Work independently without a team",
      icon: UserCheck,
      features: [
        "Independent operation",
        "Contact management",
        "Personal workspace",
        "No team dependencies"
      ],
      color: "bg-green-500",
      badge: "Individual"
    }
  ];

  // Show team code display if role was updated and team code is available
  if (showTeamCode && generatedTeamCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md sm:max-w-lg shadow-xl border-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur">
          <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
              Welcome to {organizationName}!
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2 text-muted-foreground">
              Your team has been created successfully. Share this code with your team members.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Team Code
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={generatedTeamCode}
                  readOnly
                  className="font-mono text-lg text-center bg-background"
                />
                <Button
                  onClick={copyTeamCode}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-green-600 dark:text-green-400 text-xs mt-2 text-center">Copied to clipboard!</p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-muted-foreground">
                  Share this code with your team members during registration
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-muted-foreground">
                  Team members can join by entering this code
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-muted-foreground">
                  You can manage your team from the dashboard
                </p>
              </div>
            </div>

            <Button
              onClick={continueToDashboard}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 h-10 sm:h-11 text-sm sm:text-base"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl shadow-xl border-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur">
        <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
          <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Role
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2 text-muted-foreground">
            Select the role that best describes your position in the team
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {roles.map((role) => {
              const IconComponent = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <div
                  key={role.id}
                  className={`relative p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg"
                    : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-md"
                    }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${role.color} rounded-lg flex items-center justify-center mb-3 sm:mb-0 sm:mr-4`}>
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">{role.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{role.description}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                        <span className="leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Badge className="mt-3 bg-muted text-muted-foreground hover:bg-muted/80 text-xs">
                    {role.badge}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Organization Name Input for Admin */}
          {selectedRole === "admin" && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Label htmlFor="organizationName" className="text-sm font-medium text-foreground mb-2 block">
                Organization Name *
              </Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Enter your organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full"
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will be displayed on your profile and used for team management
              </p>
            </div>
          )}

          {/* Team Code Input for Team Members */}
          {selectedRole === "user" && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Label htmlFor="teamCode" className="text-sm font-medium text-foreground mb-2 block">
                Team Code *
              </Label>
              <div className="space-y-3">
                <Input
                  id="teamCode"
                  type="text"
                  placeholder="Enter the team code provided by your administrator"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  className="w-full font-mono"
                  required
                />
                {teamCode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ask your team administrator for the team code to join their organization
              </p>
            </div>
          )}

          {/* Individual Role Info */}
          {selectedRole === "individual" && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 text-green-700 mb-3">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Individual User Setup</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                You'll have your own personal workspace with full access to contact management and CRM features.
              </p>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Independent contact management
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Personal workspace and settings
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    No team dependencies or restrictions
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleRoleSelect}
            disabled={
              !selectedRole ||
              (selectedRole === "admin" && !organizationName.trim()) ||
              (selectedRole === "user" && !teamCode.trim()) ||
              isLoading
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 disabled:opacity-50 h-10 sm:h-11 text-sm sm:text-base"
          >
            {isLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up your account...
              </span>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3 sm:mt-4 leading-relaxed">
            You can change your role later with administrator approval
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelection;