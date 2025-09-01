"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle,Avatar, AvatarFallback, AvatarImage,Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,AlertDialog,AlertDialogTrigger, AlertDialogContent,AlertDialogHeader,AlertDialogFooter,AlertDialogTitle,AlertDialogDescription,AlertDialogAction,AlertDialogCancel,} from "@/hooks/utils/common-imports";
import { Camera, Trash2, Edit3 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useUserProfile, useUpdateUserProfile, useDeleteUserAccount } from "@/hooks/apis/user-service";
import { TUserData, TUpdateData } from "@/hooks/utils/common-types";
import { validateImageFile } from "@/hooks/utils/common-utils";
import { Walkthrough, use_page_walkthrough } from "@/components/walk-through-component";
import { getPageWalkthroughSteps, WalkthroughPage } from "@/types/walkthrough-config";

const Profile = () => {
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    company: "",
    organizationName: "",
    teamCode: "",
    role: "",
    avatar: "",
  });
  const [editProfile, setEditProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    company: "",
    organizationName: "",
    teamCode: "",
    role: "",
    avatar: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  // Use TanStack Query hooks
  const { data: userData, isLoading: loading, error } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const deleteAccountMutation = useDeleteUserAccount();
  
  // Walkthrough hook for testing
  const { is_completed } = use_page_walkthrough(WalkthroughPage.PROFILE);

  // Helper to update profile state from backend user data
  const updateProfileState = (userData: TUserData) => {
    
    const [firstname, ...rest] = userData.name?.split(" ") || ["", ""];
    const lastname = rest.join(" ");
    const newProfile = {
      firstname,
      lastname,
      email: userData.email || "",
      phone: userData.phone || "",
      company: userData.company || "",
      organizationName: userData.organizationName || "",
      teamCode: userData.teamCode || "",
      role: userData.role || "",
      avatar: userData.photoUrl || "",
    };
    
    setProfile(newProfile);
    setEditProfile(newProfile);
  };

  // Update profile state when data is fetched
  useEffect(() => {
    if (userData) {
      updateProfileState(userData);
    }
  }, [userData]);

  // File select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateImageFile(file)) {
        setImage(file);
        toast.success(`Selected: ${file.name}`);
      } else {
        e.target.value = "";
      }
    }
  };

  // Convert file to base64 for backend upload
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error("Failed to convert file to base64"));
      };
      reader.readAsDataURL(file);
    });
  };

  const updateProfile = async (updateData: TUpdateData) => {
    try {
      const profileData = {
        name: `${updateData.name || ""}`.trim(),
        email: updateData.email,
        phone: updateData.phone,
        company: updateData.company,
        organizationName: updateData.organizationName,
        photoUrl: updateData.avatar,
      };

      await updateProfileMutation.mutateAsync(profileData);
      
      // Update local state
      setProfile({
        firstname: updateData.name?.split(" ")[0] || "",
        lastname: updateData.name?.split(" ").slice(1).join(" ") || "",
        email: updateData.email || "",
        phone: updateData.phone || "",
        company: updateData.company || "",
        organizationName: updateData.organizationName || "",
        teamCode: profile.teamCode || "", // Keep existing team code
        role: profile.role || "", // Keep existing role
        avatar: updateData.avatar || "",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      toast.error("Please select an image first");
      return;
    }

    try {
      console.log("Starting image upload process...");
      setUploading(true);
      setUploadProgress(25); // Show progress for base64 conversion
      
      // Convert file to base64
      console.log("Converting file to base64...");
      const base64Data = await convertFileToBase64(image);
      console.log("Base64 conversion successful, length:", base64Data.length);
      
      setUploadProgress(75); 
      
      // Send base64 data to backend for Cloudinary upload
      console.log("Sending to backend for Cloudinary upload...");
      await updateProfile({ ...profile, avatar: base64Data });
      
      setImage(null);
      toast.success("Profile picture updated successfully!");
      console.log("Upload process completed successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes("Failed to convert file")) {
          toast.error("Failed to process image. Please try a different file.");
        } else if (error.message.includes("Failed to upload image to Cloudinary")) {
          toast.error("Failed to upload image. Please try again or use a smaller file.");
        } else if (error.message.includes("Failed to update profile")) {
          toast.error("Failed to update profile. Please try again.");
        } else {
          toast.error("Upload failed. Please try again.");
        }
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = () => {
    setEditProfile(profile);
    setIsEditing(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${editProfile.firstname} ${editProfile.lastname}`.trim();
    await updateProfile({
      name: fullName,
      email: editProfile.email,
      phone: editProfile.phone,
      company: editProfile.company,
      avatar: editProfile.avatar,
    });
  };

  const deleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await deleteAccountMutation.mutateAsync();
      await logout();
      router.push("/auth/register");
    } catch (error) {
      toast.error("Unable to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 xl:p-7">
      <Card className="p-4 xl:p-5">
        <CardHeader>
          <CardTitle className="text-xl xl:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent" id="wt-profile-page-title">Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
      </Card>

      <Card className="profile-info" id="wt-profile-form">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section - Keep on same line */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage
                src={
                  profile.avatar
                    ? `${profile.avatar}?v=${new Date().getTime()}`
                    : "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
                }
                alt="Profile Avatar"
                onLoad={() => {}}
                onError={(e) => console.error("Avatar image failed to load:", profile.avatar, e)}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                {profile.firstname?.[0] || "U"}
                {profile.lastname?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="relative profile-avatar" id="wt-profile-avatar">
                  <Camera className="h-4 w-4 mr-2" />
                  Select Image
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileSelect}
                  />
                </Button>
                {image && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    id="wt-profile-edit-btn"
                  >
                    {uploading ? `Uploading... ${uploadProgress}%` : "Upload"}
                  </Button>
                )}
              </div>
              {image && (
                <p className="text-sm text-green-600 truncate">Selected: {image.name}</p>
              )}
              <p className="text-sm text-slate-500">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          {/* Profile Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 profile-user-info">
            <div className="space-y-2">
              <Label>First Name</Label>
              <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center">
                <span className="truncate">{profile.firstname || "Not set"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center">
                <span className="truncate">{profile.lastname || "Not set"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center">
                <span className="truncate">{profile.email || "Not set"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center">
                <span className="truncate">{profile.phone || "Not set"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center">
                <span className="truncate">{profile.company || "Not set"}</span>
              </div>
            </div>
            {profile.role === "admin" && (
              <>
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center">
                    <span className="truncate">{profile.organizationName || "Not set"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Team Code</Label>
                  <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center font-mono">
                    <span className="truncate">{profile.teamCode || "Not set"}</span>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label>Role</Label>
              <div className="border rounded px-3 py-2 bg-slate-50 min-h-[40px] flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.role === "admin" ? "bg-purple-100 text-purple-800" :
                  profile.role === "user" ? "bg-blue-100 text-blue-800" :
                  profile.role === "individual" ? "bg-green-100 text-green-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {profile.role || "Not set"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button variant="outline" onClick={handleEdit} className="profile-edit-button" id="wt-profile-edit-btn">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="profile-delete-account" id="wt-profile-delete-btn">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you absolutely sure you want to delete your account? This action cannot be undone.
                  </AlertDialogDescription>
                  <div className="mt-4 space-y-3">
                    <div className="text-sm text-slate-600">
                      <strong className="text-red-600">Warning:</strong> This will permanently delete:
                    </div>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      <li>All your contacts</li>
                      <li>All your tags</li>
                      <li>All your activities</li>
                      <li>All your chat conversations</li>
                      <li>Your profile information</li>
                    </ul>
                    <div className="text-sm text-slate-600">
                      Once deleted, all data will be lost forever and you will be redirected to the registration page.
                    </div>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <div className="text-xs text-gray-500 mt-2 sm:mt-0">
              Walkthrough Status: {is_completed ? 'Completed' : 'Not Completed'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  value={editProfile.firstname}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  name="lastname"
                  value={editProfile.lastname}
                  onChange={handleEditChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editProfile.email}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={editProfile.phone}
                onChange={handleEditChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={editProfile.company}
                onChange={handleEditChange}
              />
            </div>
            {profile.role === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  value={editProfile.organizationName}
                  onChange={handleEditChange}
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEditing(false)}
                id="wt-profile-edit-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600"
                type="submit"
                id="wt-profile-edit-save-btn"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Page-specific walkthrough */}
      <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.PROFILE)} auto_start={true} page_name={WalkthroughPage.PROFILE} />
    </div>
  );
};

export default Profile;
