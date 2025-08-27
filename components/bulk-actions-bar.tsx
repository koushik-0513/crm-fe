import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  className?: string;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDelete,
  className = ""
}) => {
  if (selectedCount === 0) return null;

  return (
    <Card className={`bg-blue-50 border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedCount} contact(s) selected
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={onDelete}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkActionsBar;
