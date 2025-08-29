import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TContact } from "@/types/global";
import { getInitials } from "@/hooks/utils/common-utils";

interface ContactsGridProps {
  contacts: TContact[];
  selectedContacts: string[];
  onSelectContact: (contactId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteContact: (contactId: string) => void;
  tagColorMap: Record<string, string>;
}

const ContactsGrid: React.FC<ContactsGridProps> = ({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onDeleteContact,
  tagColorMap
}) => {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Select All for Grid View */}
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Checkbox
          checked={
            contacts.length > 0 && selectedContacts.length === contacts.length
          }
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm text-slate-600">
          Select All ({contacts.length} contacts)
        </span>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {contacts.map((contact: TContact) => (
          <Card
            key={contact._id}
            className={`hover:shadow-lg transition-shadow cursor-pointer ${
              selectedContacts.includes(contact._id)
                ? "ring-2 ring-blue-500 bg-blue-50"
                : ""
            }`}
            onClick={() =>
              onSelectContact(
                contact._id,
                !selectedContacts.includes(contact._id)
              )
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {contact.avatar || getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">
                      <Link
                        href={`/contacts/${contact._id}`}
                        className="hover:underline text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600">{contact.company}</p>
                  </div>
                </div>
                <Checkbox
                  checked={selectedContacts.includes(contact._id)}
                  onCheckedChange={(checked) =>
                    onSelectContact(contact._id, Boolean(checked))
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>    

              <div className="space-y-2 mb-3">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <span className="font-medium">Phone:</span>
                  <span>{contact.phone}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {(contact.tags || []).map((tag: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs border-0"
                      style={{
                        backgroundColor: tagColorMap[tag] || "#e5e7eb",
                        color: "#ffffff",
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : "No recent activity"}
                </span>
                <div className="flex space-x-1" id="wt-contact-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/contacts/${contact._id}?isedit=true`);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteContact(contact._id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContactsGrid;
