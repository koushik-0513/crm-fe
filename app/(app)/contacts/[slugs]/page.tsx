"use client";

import React from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Clock,
  UserPlus,
  UserMinus,
  UserRoundCog,
  FileUser,
  Tag as TagIcon,
  Tags,
  Repeat2,
  Eye,
} from "lucide-react";
import EditContactDialog from "@/components/Contact-Edit";
import { useContact, useUpdateContact, useDeleteContact } from "@/hooks/apis/contact-Service";
import { useContactActivities } from "@/hooks/apis/activity-Service";
import { useTags } from "@/hooks/apis/tag-Service";
import type { TContact, TActivity, TTag } from "@/types/global";

// Helper function to format activity type
const formatActivityType = (activityType: string) => {
  const typeMap: Record<string, string> = {
    "CONTACT CREATED": "Contact Created",
    "CONTACT EDITED": "Contact Updated",
    "CONTACT DELETED": "Contact Deleted",
    "TAG CREATED": "Tag Created",
    "TAG EDITED": "Tag Updated",
    "TAG DELETED": "Tag Deleted",
    "FORCE DELETE TAG": "Tag Force Deleted",
    "BULK IMPORT CONTACTS": "Bulk Import Contacts",
    "BULK DELETE CONTACTS": "Bulk Delete Contacts",
    "ACCOUNT DELETED": "Account Deleted",
  };
  return typeMap[activityType] || activityType.replace("_", " ").toLowerCase();
};

// Helper function to format timestamp
const formatTimestamp = (timestamp: string | Date) => {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return String(timestamp);
  }
};

// Helper function to get activity icon
const getActivityIcon = (activityType: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "CONTACT CREATED": UserPlus,
    "CONTACT EDITED": UserRoundCog,
    "CONTACT DELETED": UserMinus,
    "TAG CREATED": TagIcon,
    "TAG EDITED": Tags,
    "TAG DELETED": Trash2,
    "FORCE DELETE TAG": Trash2,
    "BULK IMPORT CONTACTS": Repeat2,
    "BULK DELETE CONTACTS": UserMinus,
    "ACCOUNT DELETED": UserMinus,
  };
  return iconMap[activityType] || FileUser;
};

export default function ContactDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Extract the contact ID from slugs parameter
  const contactId = typeof params?.slugs === 'string' ? params.slugs : Array.isArray(params?.slugs) ? params.slugs[0] : undefined;

  useEffect(() => {
    if (searchParams?.get("isedit") === "true") {
      setIsEditModalOpen(true);
    }
  }, [searchParams]);

  // Fetch contact data using TanStack Query
  const {
    data: contact,
    isLoading,
    error,
    isError,
  } = useContact(contactId!);

  // Fetch activities data using TanStack Query
  const {
    data: activities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useContactActivities(contactId!);

  // Debug logging
  console.log("Contact details - Activities data:", {
    contactId,
    activities,
    activitiesLoading,
    activitiesError
  });

  // Fetch all tags for color mapping
  const { data: tagdata } = useTags("", undefined, undefined);

  // Mutations
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const allTags = tagdata?.tags || [];
  const tagColorMap: Record<string, string> = {};
  allTags.forEach((tag: TTag) => {
            tagColorMap[tag.name] = tag.color;
  });

  const handleDelete = () => {
    if (!contactId) return;
    deleteMutation.mutate(contactId);
  };

  const handleUpdate = async (formData: Record<string, string | string[]>) => {
    if (!contactId) return;
    updateMutation.mutate({ contactId, contactData: formData });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading contact...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-semibold">Error loading contact</p>
          <p className="text-sm">
            {error?.message || "An unexpected error occurred"}
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Link href="/contacts">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Contact not found state
  if (!contact) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-600 mb-4">
          <p className="text-lg font-semibold">Contact not found</p>
          <p className="text-sm">
            The contact you're looking for doesn't exist or has been deleted.
          </p>
        </div>
        <Link href="/contacts">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </Link>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {contact.avatar || contact.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {contact.name || "Unknown Contact"}
              </h1>
              <p className="text-slate-600">
                {contact.company || "No company specified"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <EditContactDialog
            isOpen={isEditModalOpen}
            setIsOpen={setIsEditModalOpen}
            contact={contact}
            isUpdating={updateMutation.isPending}
            onUpdate={handleUpdate}
          />

          {/* Delete Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Contact</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete{" "}
                  {contact.name || "this contact"}? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Contact"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: contact.email },
              { icon: Phone, label: "Phone", value: contact.phone },
              { icon: Building, label: "Company", value: contact.company },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center space-x-3">
                <Icon className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="font-medium">{value || "Not provided"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {contact.tags && contact.tags.length > 0 ? (
                contact.tags.map((tag: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className=""
                    style={{
                      backgroundColor: tagColorMap[tag] || "#e5e7eb",
                      color: "#ffffff",
                    }}
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No tags assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              {contact.note || "No notes available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600">Loading activities...</span>
            </div>
          ) : activitiesError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load activities</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.activityType);
                return (
                  <div
                    key={activity._id}
                    className="flex items-start space-x-3 p-4 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ActivityIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">
                          {formatActivityType(activity.activityType)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {activity.details || "No details available"}
                      </p>
                      {activity.user && (
                        <p className="text-xs text-slate-400 mt-1">
                          User: {activity.user}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No activity yet</p>
              <p className="text-slate-400 text-sm">
                Activity will appear here when actions are performed on this
                contact.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
