import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/Features/auth/context/AuthContext";
import { enrichUserWithTenant } from "@/Features/auth/utils/tenantDisplay";
import { ROLES } from "@/constants/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOutIcon, UserIcon } from "lucide-react";
import { profileApi } from "../common/pages/profileApi";

export default function NavUser() {
  const { user, logout, setUser, activeTenant, accessToken } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [fetchedAvatar, setFetchedAvatar] = useState("");

  // Base API URL setup
  let apiBase = "http://localhost:5000";
  if (import.meta.env.VITE_API_BASE_URL) {
    try {
      apiBase = new URL(import.meta.env.VITE_API_BASE_URL).origin;
    } catch (e) {
      apiBase = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");
    }
  }

  // Sync avatar if user object in context updates
  useEffect(() => {
    const contextAvatar =
      user?.profile?.avatar ||
      user?.avatar ||
      user?.profilePicture ||
      user?.image ||
      "";

    if (contextAvatar) {
      setFetchedAvatar(contextAvatar);
      setImgError(false);
    }
  }, [user]);

  // Fetch from API on initial load if no avatar exists in local state
  useEffect(() => {
    let isMounted = true;

    const loadProfileAvatar = async () => {
      const existingAvatar =
        user?.profile?.avatar ||
        user?.avatar ||
        user?.profilePicture ||
        user?.image;

      if (existingAvatar) return;

      try {
        const response = await profileApi.getProfile();
        const profileUser = response.data || response;
        
        const avatarPath =
          profileUser?.profile?.avatar ||
          profileUser?.avatar ||
          profileUser?.profilePicture ||
          profileUser?.image ||
          "";

        if (isMounted && avatarPath) {
          setFetchedAvatar(avatarPath);
          setImgError(false);
          if (typeof setUser === "function") {
            setUser(
              enrichUserWithTenant(profileUser, activeTenant, accessToken)
            );
          }
        }
      } catch (err) {
        console.error("NavUser: Failed to load profile avatar:", err);
      }
    };

    if (user) {
      loadProfileAvatar();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  if (!user) return null;

  const firstName = user?.profile?.firstName || user?.name || "";
  const lastName = user?.profile?.lastName || "";
  const displayName = `${firstName} ${lastName}`.trim() || user?.email;

  const rawAvatar =
    fetchedAvatar ||
    user?.profile?.avatar ||
    user?.avatar ||
    user?.profilePicture ||
    user?.image ||
    "";

  let avatarUrl = "";
  if (rawAvatar) {
    if (
      rawAvatar.startsWith("http://") ||
      rawAvatar.startsWith("https://") ||
      rawAvatar.startsWith("data:")
    ) {
      avatarUrl = rawAvatar;
    } else {
      const cleanPath = rawAvatar.startsWith("/") ? rawAvatar : `/${rawAvatar}`;
      avatarUrl = `${apiBase}${cleanPath}`;
    }
  }

  const fallbackLetter = displayName.charAt(0)?.toUpperCase() || "U";

  const profilePath =
    user.role === ROLES.ADMIN
      ? "/admin/profile"
      : user.role === ROLES.USER
      ? "/user/profile"
      : "/profile";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full p-0 flex items-center justify-center outline-none focus:ring-2 focus:ring-ring"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar className="h-9 w-9">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover rounded-full"
              onError={() => {
                console.error("Avatar failed to load:", avatarUrl);
                setImgError(true);
              }}
            />
          ) : (
            <AvatarFallback className="bg-slate-900 font-semibold text-white dark:bg-white dark:text-slate-900">
              {fallbackLetter}
            </AvatarFallback>
          )}
        </Avatar>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-md bg-popover text-popover-foreground shadow-md border border-border z-50"
          role="menu"
        >
          <div className="flex items-center gap-2 px-3 py-2 text-left text-sm border-b">
            <Avatar className="h-8 w-8">
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="bg-slate-900 font-semibold text-white dark:bg-white dark:text-slate-900">
                  {fallbackLetter}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(profilePath);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground outline-none"
            role="menuitem"
          >
            <UserIcon className="size-4" />
            Profile
          </button>

          <div className="my-1 h-px bg-muted" />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 outline-none"
            role="menuitem"
          >
            <LogOutIcon className="size-4" />
            Log out
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}