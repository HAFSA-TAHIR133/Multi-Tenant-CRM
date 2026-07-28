import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/common/DataTable';
import { userColumns } from '../columns/userColumns';
import UserFormDialog from '../components/UserFormDialog';
import UserDeleteDialog from '../components/UserDeleteDialog';
import { useUsers } from '../hooks/useUsers';

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
  const currentRole = auth?.user?.role || auth?.role;

  const isAdminOrSuperAdmin = currentRole === 2 || currentRole === 3;

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  const handleCreate = async (payload) => {
    await createUser(payload);
    setCreateOpen(false);
    await getAllUsers();
  };

  const handleEdit = async (payload) => {
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

  const handleNameClick = (userItem) => {
    navigate(`/users/${userItem.id}`);
  };

  const columns = useMemo(
    () =>
      userColumns({
        onEdit: isAdminOrSuperAdmin ? setEditUser : undefined,
        onDelete: isAdminOrSuperAdmin ? setDeleteUserItem : undefined,
        onToggleStatus: isAdminOrSuperAdmin ? handleToggleStatus : undefined,
        onNameClick: handleNameClick,
        showActions: isAdminOrSuperAdmin,
        currentUserRole: currentRole,
      }),
    [isAdminOrSuperAdmin, currentRole]
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        {isAdminOrSuperAdmin && (
          <Button onClick={() => setCreateOpen(true)}>Add User</Button>
        )}
      </div>

      <DataTable columns={columns} data={users} loading={loading} />

      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      <UserFormDialog
        mode="edit"
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSubmit={handleEdit}
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