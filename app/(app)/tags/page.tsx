"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTags, useBulkCreateTags, useUpdateTag, useDeleteTag } from "@/hooks/apis/tag-service";
import { toast } from "sonner";
import type { TTag } from "@/types/global";
import { Walkthrough } from "@/components/walk-through-component";
import { getPageWalkthroughSteps, WalkthroughPage } from "@/types/walkthrough-config";

type TTagDeleteError = {
  success: false;
  error: string;
  contactCount: number;
  tagName: string;
  suggestion?: string;
}

// Custom debounce hook
const useDebounce = ({ value, delay }: { value: string; delay: number }) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Tags = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TTag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage] = useState(12);

  // Debounced search term
  const debouncedSearchTerm = useDebounce({ value: searchTerm, delay: 500 });

  // Bulk add tags state
  const [newTags, setNewTags] = useState([{ name: "", color: "#3b82f6" }]);

  // TanStack Query hooks
  const { data: tagdata, isLoading } = useTags(debouncedSearchTerm, currentPage, itemsPerPage);
  const createBulkTagsMutation = useBulkCreateTags();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const handleAddTagField = () => {
    setNewTags([...newTags, { name: "", color: "#3b82f6" }]);
  };

  const handleRemoveTagField = (idx: number) => {
    setNewTags(newTags.filter((_, i) => i !== idx));
  };

  const handleTagInputChange = (idx: number, field: string, value: string) => {
    setNewTags(
      newTags.map((tag, i) => (i === idx ? { ...tag, [field]: value } : tag))
    );
  };

  const handleAddTags = async () => {
    const tagsToAdd = newTags.filter((tag) => tag.name.trim() !== "");
    if (tagsToAdd.length === 0) {
      toast.error("Please enter at least one tag name.");
      return;
    }

    createBulkTagsMutation.mutate(tagsToAdd, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewTags([{ name: "", color: "#3b82f6" }]);
      }
    });
  };

  const handleEditTag = async () => {
    if (!editingTag) return;

    updateTagMutation.mutate(
      {
        tagId: editingTag._id,
        tagData: { name: editName, color: editColor }
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setEditingTag(null);
          setEditName("");
          setEditColor("#3b82f6");
        }
      }
    );
  };

  const handleDeleteTag = async (tagId: string, force = false) => {
    deleteTagMutation.mutate(
      { tagId, force },
      {
        onError: (error: unknown) => {
          if (typeof error === 'object' && error !== null && 'contactCount' in error) {
            const tagError = error as TTagDeleteError;
            if (tagError.contactCount > 0) {
              if (
                confirm(
                  `Tag "${tagError.tagName}" is used by ${tagError.contactCount} contact(s). Do you want to remove it from all contacts and delete the tag?`
                )
              ) {
                handleDeleteTag(tagId, true);
              }
            } else {
              toast.error(tagError.error || "Failed to delete tag");
            }
          } else {
            toast.error("Failed to delete tag");
          }
        }
      }
    );
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const tags = tagdata?.tags || [];
  const tagCounts = tagdata?.tagCounts || {};
  const pagination = tagdata?.pagination;

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" id="wt-tags-page-title">
            Tags
          </h1>
          <p className="text-muted-foreground">
            Organize your contacts with tags
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2  text-white  border-0 " >
              <Plus className="h-4 w-4" />
              Add Tags
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Add Multiple Tags</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Enter names and colors for all tags.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTags();
              }}
            >
              {newTags.map((tag, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 shadow-sm">
                  <div className="flex-1 w-full space-y-2">
                    <Label htmlFor={`name-${idx}`} className="text-sm font-medium text-gray-900 dark:text-gray-100">Tag Name *</Label>
                    <Input
                      id={`name-${idx}`}
                      name={`name-${idx}`}
                      placeholder="Enter tag name"
                      required
                      value={tag.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleTagInputChange(idx, "name", e.target.value)
                      }
                      className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                  <div className="w-full sm:w-auto space-y-2">
                    <Label htmlFor={`color-${idx}`} className="text-sm font-medium text-gray-900 dark:text-gray-100">Color *</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`color-${idx}`}
                        name={`color-${idx}`}
                        type="color"
                        required
                        value={tag.color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTagInputChange(idx, "color", e.target.value)
                        }
                        className="w-14 h-10 p-1 rounded-lg border-gray-300 dark:border-gray-500 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono hidden sm:inline">{tag.color}</span>
                    </div>
                  </div>
                  {newTags.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto mt-2 sm:mt-6 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 bg-white dark:bg-gray-700 hover:border-red-400 dark:hover:border-red-500 transition-colors"
                      onClick={() => handleRemoveTagField(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTagField}
                  className="w-full sm:w-auto order-2 sm:order-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors rounded-lg"
                >
                  + Add Another
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="w-full sm:w-auto bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 border-0 w-full sm:w-auto transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                    disabled={createBulkTagsMutation.isPending}
                  >
                    {createBulkTagsMutation.isPending ? "Adding..." : "Add Tag(s)"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="wt-tags-list-container">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading tags...</span>
          </div>
        ) : tags.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {debouncedSearchTerm ? "No tags found matching your search." : "No tags found."}
          </div>
        ) : (
          tags.map((tag: TTag) => (
            <div
              key={tag._id}
              className="group relative bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#343434] rounded-2xl p-6 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200 hover:scale-[1.02] shadow-sm"
              id="wt-tag-actions"
            >
              {/* Tag Color Badge */}
              <div
                className="inline-flex items-center justify-center text-white text-sm font-medium px-4 py-2 rounded-full mb-4"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </div>

              {/* Contact Count */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {tagCounts[tag.name] || 0} contact{(tagCounts[tag.name] || 0) === 1 ? "" : "s"}
              </p>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => {
                    setEditingTag(tag);
                    setEditName(tag.name);
                    setEditColor(tag.color);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                  onClick={() => handleDeleteTag(tag._id)}
                  disabled={deleteTagMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-2 mt-8">
          {/* Mobile pagination info */}
          <div className="text-sm text-muted-foreground sm:hidden">
            Page {currentPage} of {pagination.total_pages}
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={pagination.page <= 1}
              id="wt-tags-pagination-previous"
              className="px-2 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>

            {/* Desktop pagination numbers */}
            <div className="hidden sm:flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let pageNum;
                if (pagination.total_pages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.total_pages - 2) {
                  pageNum = pagination.total_pages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 tags-pagination-page"
                    id="wt-tags-pagination-page"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            {/* Mobile pagination numbers - simplified */}
            <div className="flex sm:hidden items-center space-x-1">
              {[
                Math.max(1, currentPage - 1),
                currentPage,
                Math.min(pagination.total_pages, currentPage + 1)
              ].filter((num, idx, arr) => arr.indexOf(num) === idx).map(pageNum => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8"
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="tags-pagination-next px-2 sm:px-3"
              id="wt-tags-pagination-next"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="mx-4 sm:mx-0 sm:max-w-[425px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Edit Tag</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">Update the tag information.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleEditTag();
            }}
          >
            <div className="space-y-3">
              <Label htmlFor="edit-name" className="text-sm font-medium text-gray-900 dark:text-gray-100">Tag Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                required
                className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-color" className="text-sm font-medium text-gray-900 dark:text-gray-100">Color *</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  value={editColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditColor(e.target.value)}
                  required
                  className="w-14 h-10 p-1 rounded-lg border-gray-300 dark:border-gray-500 cursor-pointer"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{editColor}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                id="wt-edit-tag-cancel-btn"
                className="w-full sm:w-auto order-2 sm:order-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 border-0 w-full sm:w-auto order-1 sm:order-2 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                disabled={updateTagMutation.isPending}
                id="wt-edit-tag-save-btn"
              >
                {updateTagMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Page-specific walkthrough */}
      <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.TAGS)} auto_start={true} page_name={WalkthroughPage.TAGS} />
    </div>
  );
};

export default Tags;