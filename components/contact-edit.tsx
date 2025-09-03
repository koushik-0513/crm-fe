import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TContact } from '@/types/global';

type TEditContactDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  contact: TContact;
  isUpdating: boolean;
  onUpdate: (formData: Record<string, string>) => Promise<void>;
}

export default function EditContactDialog({
  isOpen,
  setIsOpen,
  contact,
  isUpdating,
  onUpdate
}: TEditContactDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isUpdating}>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>Update contact information.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.currentTarget));
            // Convert FormDataEntryValue to string for form fields
            const stringFormData: Record<string, string> = {};
            Object.entries(formData).forEach(([key, value]) => {
              stringFormData[key] = String(value);
            });
            await onUpdate(stringFormData);
          }}
        >
          {["name", "email", "phone", "company", "tags", "note"].map((field) => (
            <div className="space-y-2" key={field}>
              <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
              {field === "note" ? (
                <Textarea
                  id={field}
                  name={field}
                  defaultValue={String(contact[field as keyof TContact] || "")}
                  placeholder={`Enter ${field}...`}
                />
              ) : (
                <Input
                  id={field}
                  name={field}
                  defaultValue={String(contact[field as keyof TContact] || "")}
                  placeholder={field === "tags" ? "Enter tags (comma-separated)..." : `Enter ${field}...`}
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}