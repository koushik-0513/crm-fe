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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TContact } from "@/types/global";
import { getInitials } from "@/hooks/utils/common-utils";

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
        <TableRow className="border-border">
          <TableHead className="w-12">
            <Checkbox
              checked={
                contacts.length > 0 &&
                selectedContacts.length === contacts.length
              }
              className="dark:border-1 dark:border-[#81848a] cursor-pointer"
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
          <TableHead className="text-muted-foreground font-medium">Company</TableHead>
          <TableHead className="text-muted-foreground font-medium">Tags</TableHead>
          <TableHead className="text-muted-foreground font-medium">Last Interaction</TableHead>
          <TableHead className="w-12 text-muted-foreground font-medium">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact: TContact) => (
          <TableRow key={contact._id} className="border-border hover:bg-muted/50">
            <TableCell>
              <Checkbox
                checked={selectedContacts.includes(contact._id)}
                className="dark:border-1 dark:border-[#81848a] cursor-pointer"
                onCheckedChange={(checked) =>
                  onSelectContact(contact._id, Boolean(checked))
                }
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-3 ">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {contact.avatar || getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <Link
                    href={`/contacts/${contact._id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {contact.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">{contact.email}</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-foreground">{contact.company || '-'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(contact.tags || []).map((tag: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs px-2 py-1 font-medium rounded-sm bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {contact.lastInteraction
                ? (() => {
                  const date = new Date(contact.lastInteraction);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - date.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return `${diffDays} days ago`;
                })()
                : 'N/A'
              }
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      router.push(`/contacts/${contact._id}?isedit=true`);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDeleteContact(contact._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ContactsTable;
