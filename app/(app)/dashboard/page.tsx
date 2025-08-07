"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Activity, Tags } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useContactStats, useContacts } from "@/hooks/apis/contact-Service";
import { useTags } from "@/hooks/apis/tag-Service";
import { useActivityLogs } from "@/hooks/apis/activity-Service";
import type { TContact, TActivity } from "@/types/global";
import { isNumberRecord, isArrayOfNumbers } from '@/utils/type-Guards';

const Dashboard = () => {
  const { data: contactData, isLoading: statsLoading } = useContactStats();
  const { data: contactsData, isLoading: contactsLoading } = useContacts('', 1, 50, '');
  const { data: tagData, isLoading: tagsLoading } = useTags('', undefined, undefined);
  const { data: activityData, isLoading: activitiesLoading } = useActivityLogs();

  const contacts = contactsData?.contacts || [];
  const tags = contactData?.tagDistribution || [];
  const dashboardActivitiesByDay = contactData?.activitiesByDay || {};
  const countbycompany = contactData?.contactsByCompany || [];
  const activities = activityData || [];

  // Enhanced color palette for pie chart
  const pieChartColors = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#8b5cf6", // Purple
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange
    "#ec4899", // Pink
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#a855f7", // Violet
  ];

  const totalContacts = contactData?.totalContacts || 0;
  const totalTags = tagData?.tags?.length || 0;
  const totalActivities = contactData?.activities || 0;
  const newThisWeek = contactData?.newThisWeek || 0;

  const companyCounts = countbycompany.reduce((acc: Record<string, number>, companyData: { name: string; contacts: number }) => {
    const company = companyData.name || 'Unknown';
    acc[company] = (acc[company] || 0) + companyData.contacts;
    return acc;
  }, {} as Record<string, number>);

  const contactsByCompany = Object.entries(companyCounts)
    .sort(([, a], [, b]) => {
      if (!isNumberRecord({ a, b })) return 0;
      return b - a;
    })
    .slice(0, 5)
    .map(([name, contacts]) => ({ name, contacts }));

  // Use dashboard activities by day (from the new endpoint)
  const activitiesTimeline = Object.entries(dashboardActivitiesByDay).map(([day, count]) => ({
    day,
    activities: isNumberRecord({ count }) ? count : 0
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
      const percentage = totalTaggedContacts > 0 ? Math.round(((isNumberRecord({ count }) ? count : 0) / totalTaggedContacts) * 100) : 0;
      // Use enhanced color palette instead of tag color
      const color = pieChartColors[index % pieChartColors.length];
              return { name, value: percentage, color, count: isNumberRecord({ count }) ? count : 0 };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Add "Other" category if there are more tags
  if (Object.keys(tagCounts).length > 5) {
    const otherCount = Object.entries(tagCounts)
      .slice(5)
      .reduce((sum: number, [, count]: [string, number]) => sum + count, 0);
    const otherPercentage = totalTaggedContacts > 0 ? Math.round((otherCount / totalTaggedContacts) * 100) : 0;
    if (otherPercentage > 0) {
      tagDistribution.push({
        name: "Other",
        value: otherPercentage,
        color: "#6b7280", // Gray for "Other"
        count: otherCount
      });
    }
  }

  if (statsLoading || contactsLoading || tagsLoading || activitiesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-2">Loading dashboard data...</p>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-2">Welcome back! Here's what's happening with your CRM.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalContacts}</div>
            <p className="text-xs text-blue-600 mt-1">
              {newThisWeek > 0 ? `+${newThisWeek} new this week` : 'No new contacts this week'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">New This Week</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{newThisWeek}</div>
            <p className="text-xs text-green-600 mt-1">
              {newThisWeek > 0 ? 'New contacts added' : 'No new contacts'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{totalActivities}</div>
            <p className="text-xs text-purple-600 mt-1">
              {totalActivities > 0 ? 'Activities logged' : 'No activities yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Active Tags</CardTitle>
            <Tags className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{totalTags}</div>
            <p className="text-xs text-orange-600 mt-1">
              {totalTags > 0 ? 'Tags available' : 'No tags created'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts by Company Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Contacts by Company</CardTitle>
            <CardDescription>
              {contactsByCompany.length > 0
                ? 'Top companies with most contacts'
                : 'No company data available'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contactsByCompany.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countbycompany}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="contacts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No company data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activities This Week</CardTitle>
            <CardDescription>Daily activity tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activitiesTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="activities"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contacts</CardTitle>
          <CardDescription>
            {contacts.length > 0
              ? `Showing ${Math.min(contacts.length, 10)} of ${contacts.length} contacts`
              : 'No contacts available'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.slice(0, 10).map((contact: TContact, index: number) => (
                <div key={contact._id || index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">
                        {contact.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{contact.name}</p>
                      <p className="text-sm text-slate-500">{contact.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{contact.company}</p>
                    <p className="text-xs text-slate-500">{contact.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-slate-500">
              No contacts available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tag Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tag Distribution</CardTitle>
          <CardDescription>
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
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {tagDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => `Tag: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="lg:w-1/2 space-y-4">
                {tagDistribution.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    ></div>
                    <span className="text-sm font-medium">{tag.name}</span>
                    <span className="text-sm text-slate-500">
                      {tag.value}% ({tag.count} contacts)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No tagged contacts available
            </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;