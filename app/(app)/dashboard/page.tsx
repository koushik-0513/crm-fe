"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Activity, Tags, User, Mail, Building2, Calendar, UserCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useContactStats } from "@/hooks/apis/contact-service";
import { useTags } from "@/hooks/apis/tag-service";
import { useActivityLogs } from "@/hooks/apis/activity-service";
import { useUserProfile } from "@/hooks/apis/user-service";
import type { TContact } from "@/types/global";
import { Walkthrough } from "@/components/walk-through-component";
import { getPageWalkthroughSteps, WalkthroughPage } from "@/types/walkthrough-config";
import { MyTeamTable } from "@/components/team-table-component";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "next-themes";

const Dashboard = () => {
  const { data: contactData, isLoading: statsLoading } = useContactStats();
  const { data: tagData, isLoading: tagsLoading } = useTags('', 1, 1000);
  const { data: activityData, isLoading: activitiesLoading } = useActivityLogs();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const router = useRouter();
  const { theme } = useTheme();

  const contacts = contactData?.allContacts || [];
  const dashboardActivitiesByDay = contactData?.activitiesByDay || {};
  const contactsByCompany = contactData?.contactsByCompany || [];

  // Check if user has selected a role - this is important for security
  useEffect(() => {
    if (!profileLoading && userProfile && !userProfile.role) {
      // User doesn't have a role, redirect to role selection
      console.log("User has no role, redirecting to role selection");
      router.push("/auth/role-selection");
    }
  }, [userProfile, profileLoading, router]);

  const currentUserRole = userProfile?.role || "user";
  const isDark = theme === 'dark';

  const pieChartColors = [
    "#3b82f6", // Blue
    "#10b981", // Green  
    "#8b5cf6", // Purple
    "#f59e0b", // Orange
    "#ef4444", // Red
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange variant
    "#ec4899", // Pink
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#a855f7", // Purple variant
  ];

  // Theme-aware chart colors
  const chartTheme = {
    grid: isDark ? "#374151" : "#e5e7eb",
    text: isDark ? "#9ca3af" : "#6b7280",
    axis: isDark ? "#4b5563" : "#d1d5db",
    tooltip: {
      bg: isDark ? "#1f2937" : "#ffffff",
      border: isDark ? "#374151" : "#e5e7eb",
      text: isDark ? "#f9fafb" : "#111827"
    }
  };

  const totalContacts = contactData?.totalContacts || 0;
  const totalTags = tagData?.tags?.length || 0;
  const totalActivities = contactData?.activities || 0;
  const newThisWeek = contactData?.newThisWeek || 0;

  // Use dashboard activities by day (from the new endpoint)
  const activitiesTimeline = Object.entries(dashboardActivitiesByDay).map(([day, count]) => ({
    day,
    activities: count || 0
  }));

  // Process tag distribution with enhanced colors
  const tagCounts: Record<string, number> = {};
  contacts.forEach((contact: TContact) => {
    if (contact.tags && Array.isArray(contact.tags)) {
      contact.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const totalTaggedContacts = Object.values(tagCounts).reduce((sum: number, count: number) => sum + count, 0);

  const tagDistribution = Object.entries(tagCounts)
    .map(([name, count], index) => {
      const percentage = totalTaggedContacts > 0 ? Math.round((count / totalTaggedContacts) * 100) : 0;
      const color = pieChartColors[index % pieChartColors.length];
      return { name, value: percentage, color, count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (Object.keys(tagCounts).length > 5) {
    const otherCount = Object.entries(tagCounts)
      .slice(5)
      .reduce((sum: number, [, count]: [string, number]) => sum + count, 0);
    const otherPercentage = totalTaggedContacts > 0 ? Math.round((otherCount / totalTaggedContacts) * 100) : 0;
    if (otherPercentage > 0) {
      tagDistribution.push({
        name: "Other",
        value: otherPercentage,
        color: "#6b7280",
        count: otherCount
      });
    }
  }

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

  // Show loading only if critical data is loading
  if (statsLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="space-y-8 p-4 md:p-6 lg:p-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" id="wt-dashboard-title">
              Hello, Welcome Back!
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">Loading your dashboard data...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-200/50 dark:from-gray-800/80 dark:to-gray-900/80 dark:border-gray-600/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-muted/60 rounded w-24"></div>
                  <div className="h-4 w-4 bg-muted/60 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted/60 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted/60 rounded w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" id="wt-dashboard-page-title">
              Hello, Welcome Back!
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">Here's what's happening with your CRM today.</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-white overflow-hidden" id="wt-total-contacts-card">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Total Contacts</CardTitle>
              <Users className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">{totalContacts}</div>
              <p className="text-xs text-white/70 text-modern-light">
                {newThisWeek > 0 ? `+${newThisWeek} new this week` : 'No new contacts this week'}
              </p>
            </CardContent>
          </Card>

          <Card className="relative bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-white overflow-hidden" id="wt-new-contacts-card">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">New This Week</CardTitle>
              <UserPlus className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">{newThisWeek}</div>
              <p className="text-xs text-white/70 text-modern-light">
                {newThisWeek > 0 ? 'New contacts added' : 'No new contacts'}
              </p>
            </CardContent>
          </Card>

          <Card className="relative bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-white overflow-hidden" id="wt-total-activities-card">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Total Activities</CardTitle>
              <Activity className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">{totalActivities}</div>
              <p className="text-xs text-white/70 text-modern-light">
                {totalActivities > 0 ? 'Activities logged' : 'No activities yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="relative bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-white overflow-hidden" id="wt-active-tags-card">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Active Tags</CardTitle>
              <Tags className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">{totalTags}</div>
              <p className="text-xs text-white/70 text-modern-light">
                {totalTags > 0 ? 'Tags available' : 'No tags created'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contacts by Company Chart */}
          <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 dark:from-gray-800/80 dark:to-gray-900/80 dark:border-gray-600/50" id="wt-contacts-by-company-chart">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-foreground">Contacts by Company</CardTitle>
              <CardDescription className="text-muted-foreground">
                {contactsByCompany.length > 0
                  ? 'Top companies with most contacts'
                  : 'No company data available'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactsByCompany.length > 0 ? (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contactsByCompany} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartTheme.grid}
                        opacity={0.6}
                      />
                      <XAxis
                        dataKey="name"
                        stroke={chartTheme.text}
                        fontSize={12}
                        tick={{ fill: chartTheme.text }}
                        axisLine={{ stroke: chartTheme.axis }}
                      />
                      <YAxis
                        stroke={chartTheme.text}
                        fontSize={12}
                        tick={{ fill: chartTheme.text }}
                        axisLine={{ stroke: chartTheme.axis }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTheme.tooltip.bg,
                          border: `1px solid ${chartTheme.tooltip.border}`,
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          color: chartTheme.tooltip.text,
                          fontSize: '14px'
                        }}
                      />
                      <Bar
                        dataKey="contacts"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No company data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities Timeline Chart */}
          <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 dark:from-gray-800/80 dark:to-gray-900/80 dark:border-gray-600/50" id="wt-activities-timeline-chart">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-foreground">Activities This Week</CardTitle>
              <CardDescription className="text-muted-foreground">Daily activity tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activitiesTimeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartTheme.grid}
                      opacity={0.6}
                    />
                    <XAxis
                      dataKey="day"
                      stroke={chartTheme.text}
                      fontSize={12}
                      tick={{ fill: chartTheme.text }}
                      axisLine={{ stroke: chartTheme.axis }}
                    />
                    <YAxis
                      stroke={chartTheme.text}
                      fontSize={12}
                      tick={{ fill: chartTheme.text }}
                      axisLine={{ stroke: chartTheme.axis }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltip.bg,
                        border: `1px solid ${chartTheme.tooltip.border}`,
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        color: chartTheme.tooltip.text,
                        fontSize: '14px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activities"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2, fill: chartTheme.tooltip.bg }}
                      className="drop-shadow-sm"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <MyTeamTable />

        {/* Tag Distribution Chart */}
        <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 dark:from-gray-800/80 dark:to-gray-900/80 dark:border-gray-600/50" id="wt-tag-distribution-chart">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">Tag Distribution</CardTitle>
            <CardDescription className="text-muted-foreground">
              {tagDistribution.length > 0
                ? 'Breakdown of contact tags'
                : 'No tagged contacts available'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tagDistribution.length > 0 ? (
              <div className="flex flex-col xl:flex-row items-center gap-8">
                <div className="w-full xl:w-1/2 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        className="drop-shadow-sm"
                      >
                        {tagDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            className="hover:opacity-80 transition-opacity duration-200"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, name]}
                        labelFormatter={(label) => `Tag: ${label}`}
                        contentStyle={{
                          backgroundColor: chartTheme.tooltip.bg,
                          border: `1px solid ${chartTheme.tooltip.border}`,
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          color: chartTheme.tooltip.text,
                          fontSize: '14px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full xl:w-1/2 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Legend</h4>
                  {tagDistribution.map((tag, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm border-2 border-background"
                          style={{ backgroundColor: tag.color }}
                        ></div>
                        <span className="text-sm font-medium text-foreground">{tag.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">
                        {tag.value}% ({tag.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Tags className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No tagged contacts available</p>
                  <p className="text-sm mt-2">Start adding tags to your contacts to see the distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.DASHBOARD)} auto_start={true} page_name={WalkthroughPage.DASHBOARD} />
      </div>
    </div>
  );
};

export default Dashboard;