"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid3X3, List, Filter } from "lucide-react";
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
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground contact-heading" id="wt-contacts-page-title">
            Contacts
          </h1>
          <p className="text-muted-foreground">
            Manage your contact database
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="flex-1 relative search-contacts max-w-md" id="wt-contacts-search-input">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10 border-border rounded-sm focus:outline-none dark:bg-[#171717]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className=""
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter by tag
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-border hover:bg-muted contact-import-csv-button rounded-sm dark:bg-[#171717]"
              id="wt-import-csv-btn"
              onClick={openCsvModal}
            >
              Import CSV
            </Button>
            <Button
              className="bg-foreground text-background hover:bg-foreground/90 contact-add-contact-button rounded-sm dark:bg-[#171717] dark:text-white"
              id="wt-add-contact-btn"
              onClick={openAddModal}
            >
              Add Contact
            </Button>

            {/* View mode toggle */}
            <div className="flex border border-border rounded-sm overflow-hidden view-mode-buttons dark:bg-[#171717] dark:border-[#2a2a2a]" id="wt-contacts-view-toggle">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewModeChange("list")}
                className={`rounded-tl-sm rounded-bl-sm rounded-tr-none rounded-br-none border-0 h-9 px-3 ${viewMode === "list"
                  ? "bg-muted text-foreground"
                  : "hover:bg-muted/50"
                  }`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewModeChange("grid")}
                className={`rounded-tr-sm rounded-br-sm rounded-tl-none rounded-bl-none border-0 h-9 px-3 ${viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "hover:bg-muted/50"
                  }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedContacts.length}
          onDelete={handleDelete}
        />

        {/* Contacts Display */}
        <div className="contact-list bg-card border border-border  rounded-sm dark:bg-[#171717]" id="wt-contacts-list-container">
          {viewMode === "grid" || isMobile || window.innerWidth < 1320 ? (
            <div className="p-6">
              <ContactsGrid
                contacts={contacts}
                selectedContacts={selectedContacts}
                onSelectContact={handleSelectContact}
                onSelectAll={handleSelectAll}
                onDeleteContact={handleDeleteOne}
                tagColorMap={tagColorMap}
              />
            </div>
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
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            className="hover:bg-muted rounded-sm dark:bg-[#171717]"
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
                pagenumber === pageNum ? "font-bold bg-foreground text-background rounded-sm" : "hover:bg-muted rounded-sm"
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
            className="hover:bg-muted rounded-sm dark:bg-[#171717]"
            onClick={() => setPagenumber((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>

        {/* Pagination Info */}
        {contacts.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Page {pagenumber} - Showing {contacts.length} contacts
          </div>
        )}

        {/* Page-specific walkthrough */}
        <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.CONTACTS)} auto_start={true} page_name={WalkthroughPage.CONTACTS} />

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
    </div>
  );
};

export default Contacts;