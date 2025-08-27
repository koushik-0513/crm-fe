"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Grid3X3, List } from "lucide-react";
import { useContacts, useDeleteContact, useDeleteMultipleContacts } from "@/hooks/apis/contact-service";
import { useTags } from "@/hooks/apis/tag-service";
import SMSMessage from "@/components/sms-message";
import { toast } from "sonner";
import type { TContact, TContactForm } from "@/types/global";
import { Walkthrough } from "@/components/walk-through-component";
import { getPageWalkthroughSteps, WalkthroughPage } from "@/types/walkthrough-config";

// Custom hooks
import { useDebounce } from "@/hooks/utils/use-debounce";
import { useToggle } from "@/hooks/utils/use-toggle";
import { useTagColorMap } from "@/hooks/utils/use-tag-color-map";
import { usePagination } from "@/hooks/utils/use-pagination";

// Components
import ContactFormDialog from "@/components/contact-form-dialog";
import CsvImportDialog from "@/components/csv-import-dialog";
import BulkActionsBar from "@/components/bulk-actions-bar";
import ContactsGrid from "@/components/contacts-grid";
import ContactsTable from "@/components/contacts-table";

const Contacts = () => {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [pagenumber, setPagenumber] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const itemsPerPage = 12;

  // Custom hooks
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { open: isAddModalOpen, openOn: openAddModal, close: closeAddModal } = useToggle();
  const { open: csvModalOpen, openOn: openCsvModal, close: closeCsvModal } = useToggle();

  // TanStack Query hooks
  const { data: contactdata } = useContacts(debouncedSearch, pagenumber, itemsPerPage, "");
  const { data: tagdata } = useTags("", 1, 1000);

  // Mutations
  const deleteContactMutation = useDeleteContact();
  const deleteMultipleContactsMutation = useDeleteMultipleContacts();

  const contacts = contactdata?.contacts || [];
  const tags = tagdata?.tags || [];

  // Custom hooks
  const tagColorMap = useTagColorMap(tags);
  const { hasNext, hasPrev, visible } = usePagination(pagenumber, itemsPerPage, contactdata?.pagination?.total);

  // Responsive logic to force grid view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024; // lg breakpoint for hiding list button
      const shouldForceGrid = window.innerWidth < 1320; // force grid below 1320px
      setIsMobile(isMobileView);
      if (shouldForceGrid) {
        setViewMode("grid");
      }
    };
    
    // Set initial view mode
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map((c: TContact) => c._id));
    } else {
      setSelectedContacts([]);
    }
  }, [contacts]);

  const handleSelectContact = useCallback((contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    }
  }, [selectedContacts]);

  const handleDelete = useCallback(async () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact to delete.");
      return;
    }
    deleteMultipleContactsMutation.mutate({ contactIds: selectedContacts }, {
      onSuccess: () => {
        setSelectedContacts([]);
      }
    });
  }, [selectedContacts, deleteMultipleContactsMutation]);

  const handleDeleteOne = useCallback(async (contactId: string) => {
    deleteContactMutation.mutate(contactId);
  }, [deleteContactMutation]);

  const handleContactSelect = useCallback((contactData: TContactForm) => {
    // This can be used to pre-fill the contact form from CSV
    openAddModal();
  }, [openAddModal]);

  const handleViewModeChange = useCallback((mode: "list" | "grid") => {
    // Only allow view mode change on desktop and when width >= 1320px
    if (!isMobile && window.innerWidth >= 1320) {
      setViewMode(mode);
    }
  }, [isMobile]);

  return (
    <div className="space-y-6 m-7">
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent contact-heading" id="wt-contacts-page-title">
              Contacts
            </h1>
            <p className="text-slate-600 mt-2">
              Manage your customer relationships
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 contact-add-contact-button"
              id="wt-add-contact-btn"
              onClick={openAddModal}
            >
              Add Contact
            </Button>

            <SMSMessage className="contact-sms-button" />

            <Button
              variant="outline"
              className="contact-import-csv-button"
              id="wt-import-csv-btn"
              onClick={openCsvModal}
            >
              Import CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative search-contacts" id="wt-contacts-search-input">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search contacts..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-row-reverse items-end overflow-hidden">
        {/* View mode toggle - show only grid button on mobile/tablet, both buttons on desktop */}
        <div className="flex border rounded-lg overflow-hidden view-mode-buttons" id="wt-contacts-view-toggle">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("list")}
            className="hidden lg:flex rounded-none border-0"
          >
            <List className="h-4 w-4 mr-2"/>
            List
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("grid")}
            className="rounded-none border-0"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Grid
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedContacts.length}
        onDelete={handleDelete}
      />

      {/* Contacts Display */}
      <Card className="contact-list" id="wt-contacts-list-container">
        <CardHeader>
          <CardTitle>All Contacts ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" || isMobile || window.innerWidth < 1320 ? (
            <ContactsGrid
              contacts={contacts}
              selectedContacts={selectedContacts}
              onSelectContact={handleSelectContact}
              onSelectAll={handleSelectAll}
              onDeleteContact={handleDeleteOne}
              tagColorMap={tagColorMap}
            />
          ) : (
            <ContactsTable
              contacts={contacts}
              selectedContacts={selectedContacts}
              onSelectContact={handleSelectContact}
              onSelectAll={handleSelectAll}
              onDeleteContact={handleDeleteOne}
              tagColorMap={tagColorMap}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => setPagenumber((prev) => Math.max(1, prev - 1))}
        >
          Prev
        </Button>

        {visible.map((pageNum) => (
          <Button
            key={pageNum}
            size="sm"
            variant={pagenumber === pageNum ? "default" : "outline"}
            className={
              pagenumber === pageNum ? "font-bold bg-blue-600 text-white" : ""
            }
            onClick={() => setPagenumber(pageNum)}
          >
            {pageNum}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => setPagenumber((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>

      {/* Pagination Info */}
      {contacts.length > 0 && (
        <div className="text-center text-sm text-slate-600">
          Page {pagenumber} - Showing {contacts.length} contacts
        </div>
      )}

      {/* Page-specific walkthrough */}
      <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.CONTACTS)} auto_start={true} className="contacts-walkthrough" page_name={WalkthroughPage.CONTACTS} />

      {/* Dialogs */}
      <ContactFormDialog
        open={isAddModalOpen}
        onOpenChange={closeAddModal}
      />

      <CsvImportDialog
        open={csvModalOpen}
        onOpenChange={closeCsvModal}
        onContactSelect={handleContactSelect}
      />
    </div>
  );
};

export default Contacts;