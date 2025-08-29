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
    <div className="space-y-4 sm:space-y-6 mx-4 sm:mx-6 lg:m-7">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent tags-header" id="wt-tags-page-title">
              Tags Management
            </h1>
            <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Organize your contacts with custom tags
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 tags-add-button w-full sm:w-auto" id="wt-add-tag-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Tag(s)
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-0 sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Multiple Tags</DialogTitle>
                <DialogDescription>
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
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 w-full space-y-2">
                      <Label htmlFor={`name-${idx}`} className="text-sm font-medium">Tag Name *</Label>
                      <Input
                        id={`name-${idx}`}
                        name={`name-${idx}`}
                        placeholder="Enter tag name"
                        required
                        value={tag.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTagInputChange(idx, "name", e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="w-full sm:w-auto space-y-2">
                      <Label htmlFor={`color-${idx}`} className="text-sm font-medium">Color *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`color-${idx}`}
                          name={`color-${idx}`}
                          type="color"
                          required
                          value={tag.color}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleTagInputChange(idx, "color", e.target.value)
                          }
                          className="w-16 h-10 p-1 rounded"
                        />
                        <span className="text-xs text-gray-500 hidden sm:inline">{tag.color}</span>
                      </div>
                    </div>
                    {newTags.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto mt-2 sm:mt-6 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleRemoveTagField(idx)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTagField}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    + Add Another
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto order-1 sm:order-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto"
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

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
          <div className="relative flex-1 max-w-full sm:max-w-md tags-search" id="wt-tags-search-input">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          {pagination && (
            <div className="text-sm text-gray-600 text-center sm:text-left whitespace-nowrap">
              Showing {tags.length} of {pagination.total} tags
            </div>
          )}
        </div>
      </Card>

      <Card className="tags-list" id="wt-tags-list-container">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">All Tags</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600">Loading tags...</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {debouncedSearchTerm ? "No tags found matching your search." : "No tags found."}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {tags.map((tag: TTag) => (
                  <div
                    key={tag._id}
                    className="p-3 sm:p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                    id="wt-tag-actions"
                  >
                    <div className="flex flex-col space-y-3">
                      {/* Tag info section */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm sm:text-base truncate block">{tag.name}</span>
                          <span className="text-xs text-slate-500 block mt-1">
                            {tagCounts[tag.name] || 0} contact{(tagCounts[tag.name] || 0) === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex space-x-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
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
                          className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => handleDeleteTag(tag._id)}
                          disabled={deleteTagMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-2 mt-6">
                  {/* Mobile pagination info */}
                  <div className="text-sm text-gray-600 sm:hidden">
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
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="mx-4 sm:mx-0 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Update the tag information.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleEditTag();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">Tag Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color" className="text-sm font-medium">Color *</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  value={editColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditColor(e.target.value)}
                  required
                  className="w-16 h-10 p-1 rounded"
                />
                <span className="text-sm text-gray-500">{editColor}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                id="wt-edit-tag-cancel-btn"
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto order-1 sm:order-2"
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
      <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.TAGS)} auto_start={true} className="tags-walkthrough" page_name={WalkthroughPage.TAGS} />
    </div>
  );
};

export default Tags;