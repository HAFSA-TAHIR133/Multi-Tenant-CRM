import { useState, useEffect } from "react";
import { FilePond, registerPlugin } from "react-filepond";

import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview
);

import { useAuth } from "@/Features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { profileApi } from "./profileApi.jsx";
import { Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const auth = useAuth() || {};
  const { setUser } = auth;

  const [files, setFiles] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // Auto-clear success message after 4 seconds
  useEffect(() => {
    if (message.type === "success" && message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileApi.getProfile();
        const fetchedUser = response.data || response;
        const profile = fetchedUser.profile || {};

        const nameParts = (fetchedUser.name || "").trim().split(" ");
        const fallbackFirstName = nameParts[0] || "";
        const fallbackLastName = nameParts.slice(1).join(" ") || "";

        setFormData({
          firstName: profile.firstName || fallbackFirstName,
          lastName: profile.lastName || fallbackLastName,
          email: fetchedUser.email || "",
          phone: profile.phone || "",
          designation: profile.designation || "",
          department: profile.department || "",
        });

        const initialAvatar = profile.avatar || fetchedUser.avatar;
        if (initialAvatar) {
          setFiles([
            {
              source: initialAvatar,
              options: { type: "local" },
            },
          ]);
        }

        if (typeof setUser === "function") {
          setUser(fetchedUser);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setMessage({
          type: "error",
          text:
            err.message ||
            "Could not load profile. Please verify your connection or login status.",
        });
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, []);

  if (fetching) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <p className="text-muted-foreground">Loading profile details...</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const hasPasswordChange =
      passwordData.currentPassword || passwordData.newPassword;

    if (hasPasswordChange) {
      if (!passwordData.currentPassword) {
        setMessage({
          type: "error",
          text: "Please enter your current password.",
        });
        setLoading(false);
        return;
      }
      if (!passwordData.newPassword) {
        setMessage({
          type: "error",
          text: "Please enter a new password.",
        });
        setLoading(false);
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setMessage({
          type: "error",
          text: "New password must be at least 6 characters.",
        });
        setLoading(false);
        return;
      }
      if (passwordData.currentPassword === passwordData.newPassword) {
        setMessage({
          type: "error",
          text: "New password must be different from current password.",
        });
        setLoading(false);
        return;
      }
    }

    try {
      const updatedProfileResponse = await profileApi.updateProfile(formData);

      if (hasPasswordChange) {
        await profileApi.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      }

      setMessage({
        type: "success",
        text: hasPasswordChange
          ? "Profile and password updated successfully!"
          : "Profile updated successfully!",
      });

      const updatedUser = updatedProfileResponse.data || updatedProfileResponse;
      if (typeof setUser === "function") {
        setUser(updatedUser);
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "An error occurred while saving.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>

      {message.text && (
        <div
          className={`p-3 rounded-md text-sm transition-all duration-300 ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4">Profile Image</h2>
          <div className="w-44">
            <FilePond
              files={files}
              onupdatefiles={setFiles}
              allowMultiple={false}
              name="avatar"
              acceptedFileTypes={[
                "image/png",
                "image/jpeg",
                "image/webp",
                "image/gif",
              ]}
              labelIdle={`Drag & Drop photo or <span class="filepond--label-action">Browse</span>`}
              imagePreviewHeight={160}
              stylePanelLayout="compact circle"
              server={{
                process: async (_fieldName, file, _metadata, load, error) => {
                  try {
                    const result = await profileApi.uploadAvatar(file);

                    const newAvatar =
                      result?.avatar ||
                      result?.data?.avatar ||
                      result?.user?.avatar ||
                      result?.data?.profile?.avatar ||
                      "";

                    if (!newAvatar) {
                      throw new Error("API returned an invalid avatar path structure.");
                    }

                    load(newAvatar);

                    if (typeof setUser === "function") {
                      setUser((prev) => ({
                        ...prev,
                        avatar: newAvatar,
                        profilePicture: newAvatar,
                        profile: {
                          ...prev?.profile,
                          avatar: newAvatar,
                        },
                      }));
                    }

                    setMessage({
                      type: "success",
                      text: "Profile picture updated successfully!",
                    });
                  } catch (err) {
                    console.error(err);
                    setMessage({
                      type: "error",
                      text: err.message || "Upload failed.",
                    });
                    error(err.message || "Upload error");
                  }
                },
                load: (source, load) => {
                  fetch(source)
                    .then((res) => res.blob())
                    .then(load)
                    .catch(() => {});
                },
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            PNG, JPG, WEBP or GIF accepted.
          </p>
        </div>

        <div className="md:col-span-2 bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Personal Details</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-muted text-sm cursor-not-allowed opacity-75"
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="pt-4 border-t mt-2">
              <h3 className="text-base font-semibold mb-3">Change Password</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Password Field */}
                <div>
                  <label className="text-xs font-medium uppercase text-muted-foreground">
                    Current Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 pr-10 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="text-xs font-medium uppercase text-muted-foreground">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 pr-10 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}