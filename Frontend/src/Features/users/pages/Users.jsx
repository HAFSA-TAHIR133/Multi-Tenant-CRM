import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/common/DataTable';
import { userColumns } from '../columns/userColumns';
import UserFormDialog from '../components/UserFormDialog';
import UserDeleteDialog from '../components/UserDeleteDialog';
import { useUsers } from '../hooks/useUsers';
import { Pencil, Plus } from 'lucide-react';

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('auth') || 'null');
  } catch {
    return null;
  }
}

export default function Users() {
  const navigate = useNavigate();
  const { users, getAllUsers, createUser, updateUser, deleteUser } = useUsers();
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserItem, setDeleteUserItem] = useState(null);

  const auth = getAuthUser();
  const currentUser = auth?.user || auth;
  const currentUserId = currentUser?.id || currentUser?.userId;
  const currentRole = currentUser?.role;

  // Role check: Role 2 = Admin, Role 3 = SuperAdmin
  const isAdminOrSuperAdmin = currentRole === 2 || currentRole === 3;

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  // Filter list: Admins see everyone, standard users see ONLY themselves
  const displayedUsers = useMemo(() => {
    if (isAdminOrSuperAdmin) return users;
    return users.filter((u) => String(u.id) === String(currentUserId));
  }, [users, isAdminOrSuperAdmin, currentUserId]);

  const handleCreate = async (payload) => {
    await createUser(payload);
    setCreateOpen(false);
    await getAllUsers();
  };

  const handleEdit = async (payload) => {
    if (!editUser) return;
    await updateUser(editUser.id, payload);
    setEditUser(null);
    await getAllUsers();
  };

  const handleDelete = async () => {
    if (!deleteUserItem) return;
    await deleteUser(deleteUserItem.id);
    setDeleteUserItem(null);
    await getAllUsers();
  };

  const handleToggleStatus = async (userItem) => {
    await updateUser(userItem.id, {
      isActive: !userItem.isActive,
    });
    await getAllUsers();
  };

  // Only allow navigation for Admins/SuperAdmins
  const handleNameClick = (userItem) => {
    if (isAdminOrSuperAdmin) {
      navigate(`/admin/users/${userItem.id}`);
    }
  };

  // Handler for opening the Edit Profile dialog for regular user
  const handleEditOwnProfile = () => {
    const myProfile = displayedUsers[0] || currentUser;
    setEditUser(myProfile);
  };

  const columns = useMemo(
    () =>
      userColumns({
        onEdit: (userItem) => setEditUser(userItem),
        onDelete: isAdminOrSuperAdmin ? setDeleteUserItem : undefined,
        onToggleStatus: isAdminOrSuperAdmin ? handleToggleStatus : undefined,
        // Disable name click for regular users so they don't shift to details page
        onNameClick: isAdminOrSuperAdmin ? handleNameClick : undefined,
        showActions: true,
        currentUserRole: currentRole,
      }),
    [isAdminOrSuperAdmin, currentRole, displayedUsers]
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isAdminOrSuperAdmin ? 'Users' : 'My Profile'}
        </h1>

        {/* Dynamic Button: Add User for Admin, Edit Profile for Standard User */}
        {isAdminOrSuperAdmin ? (
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        ) : (
          <Button onClick={handleEditOwnProfile} className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={displayedUsers} loading={loading} />

      {/* Create Dialog - Always Admin mode */}
      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isAdmin={isAdminOrSuperAdmin}
      />

      {/* Edit Dialog - Dynamically passes isAdmin status */}
      <UserFormDialog
        mode="edit"
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSubmit={handleEdit}
        isAdmin={isAdminOrSuperAdmin}
      />

      {deleteUserItem && (
        <UserDeleteDialog
          user={deleteUserItem}
          open={!!deleteUserItem}
          onOpenChange={(open) => !open && setDeleteUserItem(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}