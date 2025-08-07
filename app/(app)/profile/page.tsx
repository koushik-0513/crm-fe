"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Button, 
  Input, 
  Label, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Avatar, 
  AvatarFallback, 
  AvatarImage,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/hooks/utils/common-Imports";
import { Camera, Trash2, Edit3 } from "lucide-react";
import { useAuth } from "@/contexts/Auth-Context";
import { toast } from "sonner";
import axios from "axios";
import { useUserProfile, useUpdateUserProfile, useDeleteUserAccount } from "@/hooks/apis/profile-Service";
import { TUserData, TUpdateData } from "@/hooks/utils/common-Types";
import { validateImageFile, handleApiError } from "@/hooks/utils/common-Utils";

const Profile = () => {
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    company: "",
    avatar: "",
  });
  const [editProfile, setEditProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    company: "",
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

  // Cloudinary upload
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "profilepicks");
    formData.append("folder", "avatars");
    try {
      setUploading(true);
      setUploadProgress(0);
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/ddlrkl4jy/image/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(progress);
          },
        }
      );
      
      return response.data.secure_url;
    } catch (error: unknown) {
      handleApiError({ error, defaultMessage: "Upload failed" });
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateProfile = async (updateData: TUpdateData) => {
    try {
      const profileData = {
        name: `${updateData.name || ""}`.trim(),
        email: updateData.email,
        phone: updateData.phone,
        company: updateData.company,
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
      const imageUrl = await uploadToCloudinary(image);
      await updateProfile({ ...profile, avatar: imageUrl });
      setImage(null);
    } catch (error) {
      console.error("Error uploading image:", error);
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
      
      // Logout and redirect to register page
      await logout();
      router.push("/auth/register");
    } catch (error) {
      console.error("Error deleting account:", error);
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-slate-600 mt-2">Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
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
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="relative">
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
                  >
                    {uploading ? `Uploading... ${uploadProgress}%` : "Upload"}
                  </Button>
                )}
              </div>
              {image && (
                <p className="text-sm text-green-600">Selected: {image.name}</p>
              )}
              <p className="text-sm text-slate-500">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <div className="border rounded px-3 py-2 bg-slate-50">
                {profile.firstname || "Not set"}
              </div>
            </div>
            <div>
              <Label>Last Name</Label>
              <div className="border rounded px-3 py-2 bg-slate-50">
                {profile.lastname || "Not set"}
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="border rounded px-3 py-2 bg-slate-50">
                {profile.email || "Not set"}
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="border rounded px-3 py-2 bg-slate-50">
                {profile.phone || "Not set"}
              </div>
            </div>
            <div>
              <Label>Company</Label>
              <div className="border rounded px-3 py-2 bg-slate-50">
                {profile.company || "Not set"}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Button variant="outline" onClick={handleEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600"
                type="submit"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
