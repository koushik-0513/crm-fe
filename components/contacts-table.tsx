import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TContact } from "@/types/global";

interface ContactsTableProps {
  contacts: TContact[];
  selectedContacts: string[];
  onSelectContact: (contactId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteContact: (contactId: string) => void;
  tagColorMap: Record<string, string>;
}

const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onDeleteContact,
  tagColorMap
}) => {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={
                contacts.length > 0 &&
                selectedContacts.length === contacts.length
              }
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Last Interaction</TableHead>
          <TableHead className="w-12">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact: TContact) => (
          <TableRow key={contact._id}>
            <TableCell>
              <Checkbox
                checked={selectedContacts.includes(contact._id)}
                onCheckedChange={(checked) =>
                  onSelectContact(contact._id, Boolean(checked))
                }
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {contact.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  <Link
                    href={`/contacts/${contact._id}`}
                    className="hover:underline text-blue-700"
                  >
                    {contact.name}
                  </Link>
                </span>
              </div>
            </TableCell>
            <TableCell className="text-slate-600">{contact.email}</TableCell>
            <TableCell className="text-slate-600">{contact.company}</TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell className="text-slate-500 text-sm">
              {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : 'N/A'}
            </TableCell>
            <TableCell>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    router.push(`/contacts/${contact._id}?isedit=true`);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDeleteContact(contact._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ContactsTable;
