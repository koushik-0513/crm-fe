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

const Dashboard = () => {
  const { data: contactData, isLoading: statsLoading } = useContactStats();
  const { data: tagData, isLoading: tagsLoading } = useTags('', 1, 1000);
  const { data: activityData, isLoading: activitiesLoading } = useActivityLogs();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const router = useRouter();

  const contacts = contactData?.allContacts || [];
  const dashboardActivitiesByDay = contactData?.activitiesByDay || {};
  const contactsByCompany = contactData?.contactsByCompany || [];
  
  // Check if user has selected a role
  useEffect(() => {
    if (!profileLoading && userProfile && !userProfile.role) {
      router.push("/auth/role-selection");
    }
  }, [userProfile, profileLoading, router]);
  
  const currentUserRole = userProfile?.role || "user";

  const pieChartColors = [
    "#8b5cf6", 
    "#06b6d4", 
    "#10b981", 
    "#f59e0b", 
    "#ef4444", 
    "#3b82f6", 
    "#84cc16", 
    "#f97316", 
    "#ec4899", 
    "#6366f1", 
    "#14b8a6", 
    "#a855f7", 
  ];

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
        color: "#94a3b8", 
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
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 text-modern mb-2" id="wt-dashboard-title">
            Hello, Welcome Back!
          </h1>
          <p className="text-slate-500 text-modern-light text-lg">Loading your dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-slate-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 text-modern mb-2" id="wt-dashboard-page-title">
            Hello, Welcome Back!
          </h1>
          <p className="text-slate-500 text-modern-light text-lg">Here's what's happening with your CRM today.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient-bg-blue text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" id="wt-total-contacts-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Contacts</CardTitle>
            <Users className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{totalContacts}</div>
            <p className="text-xs text-white/70 text-modern-light">
              {newThisWeek > 0 ? `+${newThisWeek} new this week` : 'No new contacts this week'}
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-bg-green text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" id="wt-new-contacts-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">New This Week</CardTitle>
            <UserPlus className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{newThisWeek}</div>
            <p className="text-xs text-white/70 text-modern-light">
              {newThisWeek > 0 ? 'New contacts added' : 'No new contacts'}
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-bg-purple text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" id="wt-total-activities-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Activities</CardTitle>
            <Activity className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{totalActivities}</div>
            <p className="text-xs text-white/70 text-modern-light">
              {totalActivities > 0 ? 'Activities logged' : 'No activities yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-bg-orange text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" id="wt-active-tags-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Active Tags</CardTitle>
            <Tags className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
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
        <Card className="chart-modern" id="wt-contacts-by-company-chart">
          <CardHeader>
            <CardTitle className="text-xl text-modern">Contacts by Company</CardTitle>
            <CardDescription className="text-modern-light">
              {contactsByCompany.length > 0
                ? 'Top companies with most contacts'
                : 'No company data available'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contactsByCompany.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contactsByCompany}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="contacts" fill="url(#blueGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500 text-modern-light">
                No company data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities Timeline Chart */}
        <Card className="chart-modern" id="wt-activities-timeline-chart">
          <CardHeader>
            <CardTitle className="text-xl text-modern">Activities This Week</CardTitle>
            <CardDescription className="text-modern-light">Daily activity tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activitiesTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="activities"
                  stroke="url(#purpleGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "#8b5cf6", strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

        <MyTeamTable/>
      {/* Tag Distribution Chart */}
      <Card className="chart-modern" id="wt-tag-distribution-chart">
        <CardHeader>
          <CardTitle className="text-xl text-modern">Tag Distribution</CardTitle>
          <CardDescription className="text-modern-light">
            {tagDistribution.length > 0
              ? 'Breakdown of contact tags'
              : 'No tagged contacts available'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tagDistribution.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center">
              <ResponsiveContainer width="100%" height={300} className="lg:w-1/2">
                <PieChart>
                  <Pie
                    data={tagDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tagDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => `Tag: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="lg:w-1/2 space-y-4 pl-8">
                {tagDistribution.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    ></div>
                    <span className="text-sm font-medium text-slate-800 text-modern">{tag.name}</span>
                    <span className="text-sm text-slate-500 text-modern-light">
                      {tag.value}% ({tag.count} contacts)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500 text-modern-light">
              No tagged contacts available
            </div>
          )}
        </CardContent>
      </Card>

      <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.DASHBOARD)} auto_start={true} className="dashboard-walkthrough" page_name={WalkthroughPage.DASHBOARD} />
    </div>
    
  );
};

export default Dashboard;