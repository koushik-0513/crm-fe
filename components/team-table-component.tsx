"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, UserCheck, Building2, Copy, Check, Users } from "lucide-react";
import { use_all_users } from "@/hooks/apis/notification-service";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/apis/user-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Label } from "@/components/ui/label";

interface MyTeamTableProps {
  className?: string;
}

export const MyTeamTable: React.FC<MyTeamTableProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  
  // Only fetch users if profile is loaded and user is admin
  const shouldFetchUsers = !profileLoading && userProfile?.role === "admin";
  const { data: usersData, isLoading: usersLoading } = use_all_users(1, 100);
  
  const [copied, setCopied] = useState(false);

  // Show loading if profile is still loading
  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Card className="chart-modern border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-slate-600 text-sm">Loading team information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show for admin users
  if (!user || userProfile?.role !== "admin") {
    console.log("User not admin or profile not loaded:", { 
      user: !!user, 
      profileRole: userProfile?.role, 
      profileLoaded: !profileLoading 
    });
    return null;
  }

  // Ensure we have the required profile data
  if (!userProfile.teamCode) {
    console.log("User profile missing team code:", userProfile);
    return (
      <div className="space-y-6">
        <Card className="chart-modern border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Building2 className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-medium">Team Setup Required</p>
              <p className="text-red-600 text-sm">Please complete your team setup first</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = usersData?.data || [];
  // Backend already filters by team code, so we just need to filter by role
  const teamMembers = users.filter(user => user.role === "user");

  // Debug logging
  console.log("Debug - userProfile:", userProfile);
  console.log("Debug - usersData:", usersData);
  console.log("Debug - all users:", users);
  console.log("Debug - teamMembers:", teamMembers);
  console.log("Debug - userProfile.teamCode:", userProfile?.teamCode);
  console.log("Debug - filtered users by role:", users.filter(u => u.role === "user"));

  const copyTeamCode = async () => {
    try {
      await navigator.clipboard.writeText(userProfile.teamCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy team code:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Details Card */}
      <Card className="chart-modern border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-modern flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-600" />
            Team Information
          </CardTitle>
          <CardDescription className="text-modern-light text-sm">
            Manage your team and organization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Organization Name */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Organization Name</Label>
              <div className="p-2 bg-white rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-800">
                  {userProfile.organizationName || "Unnamed Organization"}
                </p>
              </div>
            </div>

            {/* Team Code */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Team Code</Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-2 bg-white rounded-lg border border-purple-200 font-mono text-sm text-center">
                  {userProfile.teamCode || "No team code"}
                </div>
                <Button
                  onClick={copyTeamCode}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 border-purple-300 hover:border-purple-400 h-8 px-2"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              {copied && (
                <p className="text-green-600 text-xs text-center">Copied!</p>
              )}
            </div>

            {/* Team Stats */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Team Stats</Label>
              <div className="p-2 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Members</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    {teamMembers.length + 1} {/* +1 for admin */}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">Role</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    Admin
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Team Code Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2 text-sm">Share Your Team Code</h4>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Share the team code above with potential team members</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Team members can join by entering this code during registration</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card className={`chart-modern ${className}`} id="wt-users-table">
        <CardHeader>
          <CardTitle className="text-xl text-modern flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Team Members
          </CardTitle>
          <CardDescription className="text-modern-light">
            {teamMembers.length > 0
              ? `Showing ${Math.min(teamMembers.length, 10)} of ${teamMembers.length} team members`
              : 'No team members available'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center h-[200px] text-slate-500 text-modern-light">
              <div className="text-center">
                <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-spin" />
                <p>Loading team members...</p>
              </div>
            </div>
          ) : teamMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-medium text-slate-700 text-modern">Team Member</th>
                    <th className="text-left py-4 px-4 font-medium text-slate-700 text-modern">Contact Info</th>
                    <th className="text-left py-4 px-4 font-medium text-slate-700 text-modern">Status</th>
                    <th className="text-left py-4 px-4 font-medium text-slate-700 text-modern">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.slice(0, 10).map((user, index) => (
                    <tr
                      key={user.uid || index}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-300"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-sm font-medium text-white text-modern">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-modern">{user.name || 'N/A'}</p>
                            <p className="text-sm text-slate-500 text-modern-light flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Team Member
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700 text-modern flex items-center gap-2">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {user.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 text-modern-light">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt?.toString() || "")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-slate-500 text-modern-light">
              <div className="text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p>No team members yet</p>
                <p className="text-xs mt-2">Share your team code with others to build your team</p>
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <p>Debug: API returned {users.length} users</p>
                    <p>Debug: Looking for users with role="user"</p>
                    <p>Debug: Admin team code: {userProfile?.teamCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

