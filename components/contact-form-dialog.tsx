import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useCreateContact } from "@/hooks/apis/contact-service";
import { useTags } from "@/hooks/apis/tag-service";
import type { TContactForm, TTag } from "@/types/global";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TContactForm;
}

const ContactFormDialog: React.FC<ContactFormDialogProps> = ({
  open,
  onOpenChange,
  initialData
}) => {
  const [contactForm, setContactForm] = useState<TContactForm>(
    initialData || {
      name: "",
      email: "",
      phone: "",
      company: "",
      tags: [],
      note: "",
    }
  );

  const { data: tagdata } = useTags("", 1, 1000);
  const createContactMutation = useCreateContact();
  const tags = tagdata?.tags || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: name === "tags" 
        ? value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
        : value,
    }));
  };

  const handleTagCheckbox = (tagName: string, checked: boolean) => {
    setContactForm((prev) => ({
      ...prev,
      tags: checked
        ? [...prev.tags, tagName]
        : prev.tags.filter((tag) => tag !== tagName),
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    createContactMutation.mutate(contactForm, {
      onSuccess: () => {
        onOpenChange(false);
        setContactForm({
          name: "",
          email: "",
          phone: "",
          company: "",
          tags: [],
          note: "",
        });
      }
    });
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Create a new contact in your CRM system.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter full name"
              value={contactForm.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={contactForm.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Enter phone number"
              value={contactForm.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              placeholder="Enter company name"
              value={contactForm.company}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select tags" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag: TTag) => (
                  <div
                    key={tag._id}
                    className="flex items-center space-x-2 px-2 py-1"
                  >
                    <Checkbox
                      id={`tag-${tag._id}`}
                      checked={contactForm.tags.includes(tag.name)}
                      onCheckedChange={(checked) =>
                        handleTagCheckbox(tag.name, Boolean(checked))
                      }
                    />
                    <label
                      htmlFor={`tag-${tag._id}`}
                      className="text-sm cursor-pointer"
                    >
                      {tag.name}
                    </label>
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="tags"
              name="tags"
              placeholder="Comma separated tags"
              value={Array.isArray(contactForm.tags) ? contactForm.tags.join(", ") : ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Notes</Label>
            <Textarea
              id="note"
              name="note"
              placeholder="Add any notes about this contact"
              value={contactForm.note}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              type="submit"
              disabled={createContactMutation.isPending}
            >
              {createContactMutation.isPending ? "Saving..." : "Save Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
