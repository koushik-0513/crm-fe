"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger} from "@/components/ui/dialog";
import {ArrowLeft,Trash2,Mail,Phone,Building} from "lucide-react";
import EditContactDialog from "@/components/contact-edit";
import ActivityHistory from "@/components/activity-history";
import { useContact, useUpdateContact, useDeleteContact } from "@/hooks/apis/contact-service";
import { useContactActivities } from "@/hooks/apis/activity-service";
import { useTags } from "@/hooks/apis/tag-service";

// Custom hooks and utilities
import { useTagColorMap } from "@/hooks/utils/use-tag-color-map";


export default function ContactDetail() {
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
  const { data: tagdata } = useTags("", 1, 1000);

  // Mutations
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  // Custom hooks
  const tagColorMap = useTagColorMap(tagdata?.tags || []);

  const handleDelete = () => {
    if (!contactId) return;
    deleteMutation.mutate(contactId);
  };

  const handleUpdate = async (formData: Record<string, string | string[]>) => {
    if (!contactId) return;
    updateMutation.mutate(
      { contactId, contactData: formData },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
        }
      }
    );
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
    <div className="space-y-6 p-4 xl:p-7">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/contacts">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </Link>
          <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {contact.avatar || contact.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg xl:text-xl font-bold text-slate-900 break-words">
                {contact.name || "Unknown Contact"}
              </h1>
              <p className="text-slate-600 text-sm xl:text-base break-words">
                {contact.company || "No company specified"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
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

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Mail, label: "Email", value: contact.email },
                { icon: Phone, label: "Phone", value: contact.phone },
                { icon: Building, label: "Company", value: contact.company },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50/50">
                  <Icon className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-sm text-slate-600 break-words">{value || "Not provided"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tags Card */}
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
                    variant="outline"
                    className="border-0 text-xs px-2 py-1"
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
      </div>

      {/* Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-slate-50/50">
            <p className="text-slate-600 text-sm xl:text-base leading-relaxed break-words">
              {contact.note || "No notes available"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Activity History */}
      <ActivityHistory
        activities={activities}
        isLoading={activitiesLoading}
        error={activitiesError}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
