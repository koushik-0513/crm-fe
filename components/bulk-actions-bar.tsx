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
    <Card className={`bg-accent/50 border-border dark:bg-[#171717] rounded-sm ${className} p-2 px-1`}>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} contact(s) selected
          </span>
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 dark:bg-[#171717] rounded-sm"
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
