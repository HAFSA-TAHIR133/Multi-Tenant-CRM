import { useEffect, useMemo, useState } from 'react';
import { tenantsApi } from '../api/tenantApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/common/DataTable';
import { tenantColumns } from '../columns/tenantColumns';
import AddTenantDialog from '../components/AddTenantDialog';
import EditTenantDialog from '../components/EditTenantDialog';
import DeleteTenantDialog from '../components/DeleteTenantDialog';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTenant, setEditTenant] = useState(null);
  const [deleteTenant, setDeleteTenant] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const loadTenants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tenantsApi.getTenants();
      const normalized =
        Array.isArray(res) ? res :
        Array.isArray(res?.items) ? res.items :
        Array.isArray(res?.data) ? res.data :
        [];
      setTenants(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const filteredTenants = useMemo(() => {
    const q = globalFilter.toLowerCase().trim();
    if (!q) return tenants;

    return tenants.filter((tenant) =>
      `${tenant.name || ''} ${tenant.email || ''} ${tenant.status || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [tenants, globalFilter]);

  const handleCreate = async (payload) => {
    try {
      const res = await tenantsApi.createTenant(payload);
      const created = res?.data ?? res?.item ?? res;
      setTenants((prev) => [...prev, created]);
    } catch (err) {
      setError(err.message || 'Failed to create tenant');
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      const res = await tenantsApi.updateTenant(id, payload);
      const updated = res?.data ?? res?.item ?? res;
      setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    } catch (err) {
      setError(err.message || 'Failed to update tenant');
    }
  };

  const handleDelete = async (id) => {
    try {
      await tenantsApi.deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete tenant');
    }
  };

  const handleToggleStatus = async (tenant) => {
    const nextStatus = tenant.status === 'active' ? 'inactive' : 'active';

    setTenants((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await tenantsApi.updateTenantStatus(tenant.id, nextStatus);
    } catch (err) {
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status: tenant.status } : t))
      );
      setError(err.message || 'Failed to update tenant status');
    }
  };

  const columns = tenantColumns({
    onEdit: setEditTenant,
    onDelete: setDeleteTenant,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Manage tenants, activate/deactivate, and edit records.
          </p>
        </div>

        <AddTenantDialog onCreate={handleCreate} />
      </div>

      <TextInput
        placeholder="Search tenants..."
        leftSection={<IconSearch size={16} />}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.currentTarget.value)}
        className="max-w-sm"
      />

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={columns}
            data={filteredTenants}
            loading={loading}
            emptyMessage="No tenants found."
            enableGlobalFilter={false}
            enableTopToolbar={false}
            enableBottomToolbar={false}
            enablePagination={false}
          />
        </CardContent>
      </Card>

      {editTenant ? (
        <EditTenantDialog
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditTenant(null);
          }}
          tenant={editTenant}
          onUpdate={async (id, payload) => {
            await handleUpdate(id, payload);
            setEditTenant(null);
          }}
        />
      ) : null}

      {deleteTenant ? (
        <DeleteTenantDialog
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setDeleteTenant(null);
          }}
          tenant={deleteTenant}
          onDelete={async (id) => {
            await handleDelete(id);
            setDeleteTenant(null);
          }}
        />
      ) : null}
    </div>
  );
}