import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useImportContacts } from "@/hooks/apis/contact-service";
import Papa from "papaparse";
import { toast } from "sonner";
import type { TContactForm } from "@/types/global";

type TCsvError = {
  row: number;
  message: string;
}

type TCsvContactData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  note: string;
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactSelect?: (contactData: TContactForm) => void;
}

const CsvImportDialog: React.FC<CsvImportDialogProps> = ({
  open,
  onOpenChange,
  onContactSelect
}) => {
  const [csvContacts, setCsvContacts] = useState<TCsvContactData[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvErrors, setCsvErrors] = useState<TCsvError[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  const importContactsMutation = useImportContacts();

  // Drag-and-drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results: Papa.ParseResult<Record<string, string>>) {
        const requiredFields = ["name", "email", "phone", "company"];
        const errors: TCsvError[] = [];
        const validRows: TCsvContactData[] = [];
        const seen = new Set();

        results.data.forEach((row: Record<string, string>, idx: number) => {
          const name = row.name || row.Name;
          const email = (row.email || row.Email || "").toLowerCase();
          const phone = row.phone || row.Phone;
          const company = row.company || row.Company;

          if (!name || !email || !phone || !company) {
            errors.push({ row: idx + 2, message: "Missing required fields (name, email, phone, and company)." });
          } else {
            if (seen.has(email)) {
              errors.push({ row: idx + 2, message: `Duplicate email: ${email}` });
            } else {
              seen.add(email);
              validRows.push({
                name,
                email,
                phone,
                company,
                tags: (row.tags || row.Tags || "")
                  .split(",")
                  .map((t: string) => t.trim())
                  .filter(Boolean),
                note: row.note || row.Note || "",
              });
            }
          }
        });

        setCsvErrors(errors);
        setCsvContacts(validRows);
      },
      error: function (err) {
        setCsvErrors([
          { row: 0, message: "Failed to parse CSV file. Please check your file format." },
        ]);
        setCsvContacts([]);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const handleSaveCsvContacts = async () => {
    setImporting(true);
    try {
      if (csvContacts.length === 0) {
        toast.error("No contacts to import.");
        setImporting(false);
        return;
      }
      importContactsMutation.mutate({ contacts: csvContacts }, {
        onSuccess: () => {
          toast.success("Contacts imported successfully.");
          onOpenChange(false);
          setCsvContacts([]);
          setCsvFile(null);
          setCsvErrors([]);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to import contacts. Please try again.");
        }
      });
    } catch (err) {
      toast.error("Failed to import contacts. Please try again.");
    }
    setImporting(false);
  };

  const handleCsvRowSelect = (csvRow: Record<string, string>) => {
    if (onContactSelect) {
      onContactSelect({
        name: csvRow.name || csvRow.Name || "",
        email: csvRow.email || csvRow.Email || "",
        phone: csvRow.phone || csvRow.Phone || "",
        company: csvRow.company || csvRow.Company || "",
        tags: csvRow.tags
          ? csvRow.tags.split(",").map((t: string) => t.trim())
          : csvRow.Tags
          ? csvRow.Tags.split(",").map((t: string) => t.trim())
          : [],
        note: csvRow.note || csvRow.Note || "",
      });
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1024px]">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Drag and drop a CSV file here, or click to select. Columns:
            name, email, phone, company, tags, note.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Drag-and-drop area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-700">Drop the CSV file here ...</p>
            ) : (
              <p>
                Drag & drop a CSV file here, or{" "}
                <span className="underline text-blue-700">
                  click to select
                </span>
              </p>
            )}
            {csvFile && (
              <p className="mt-2 text-xs text-slate-500">
                Selected file: {csvFile.name}
              </p>
            )}
          </div>

          {/* Error display */}
          {csvErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm space-y-1">
              {csvErrors.map((err, idx) => (
                <div key={idx}>Row {err.row}: {err.message}</div>
              ))}
            </div>
          )}

          {/* Table preview */}
          {csvContacts.length > 0 && (
            <div className="max-h-60 overflow-y-scroll border rounded p-2 bg-slate-50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvContacts.map((c, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.company}</TableCell>
                      <TableCell>{Array.isArray(c.tags) ? c.tags.join(", ") : ""}</TableCell>
                      <TableCell
                        className=""
                        style={{
                          maxWidth: "200px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                        }}
                        title={c.note}
                      >
                        {c.note}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={handleSaveCsvContacts}
              disabled={csvContacts.length === 0 || importing}
            >
              {importing ? "Importing..." : "Save All Contacts"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CsvImportDialog;
