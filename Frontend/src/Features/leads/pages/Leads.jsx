import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { leadsApi } from '../api/leadsApi';
import { getLeadColumns } from '../columns/leadColumns';
import DataTable from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, TextInput } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';

import AddLeadDialog from '../components/AddLeadDialog';

export default function Leads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const canManage = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await leadsApi.getAll();
      const normalizedLeads =
        Array.isArray(res) ? res :
        Array.isArray(res?.items) ? res.items :
        Array.isArray(res?.data) ? res.data :
        [];

      setLeads(normalizedLeads);
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadLeads();
    }
  }, [user?.id, role]);

  const filteredLeads = useMemo(() => {
    const q = globalFilter.toLowerCase().trim();
    if (!q) return leads;

    return leads.filter((lead) =>
      [
        lead.contactName,
        lead.email,
        lead.phone,
        lead.companyName,
        lead.status,
        lead.source,
        lead.title,
        lead.assignedUser?.name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [leads, globalFilter]);

  const handleView = (lead) => {
    const targetId = lead?.id || lead?._id;
    if (!targetId) return;

    if (canManage) {
      navigate(`/admin/leads/${targetId}`);
    } else {
      navigate(`/user/leads/${targetId}`);
    }
  };

  const handleStatusChange = async (lead, nextStatus) => {
    if (!['open', 'closed'].includes(nextStatus) || nextStatus === lead.status) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: nextStatus } : l))
    );

    try {
      await leadsApi.updateStatus(lead.id, nextStatus);
    } catch (err) {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l))
      );
      setError(err.message || 'Failed to update lead status');
    }
  };

  // Generate columns without inline edit/delete handlers
  const columns = useMemo(
    () =>
      getLeadColumns({
        userRole: role,
        currentUser: user,
        onView: handleView,
        onStatusChange: handleStatusChange,
        canManage,
        statusOptions: [
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' },
        ],
      }),
    [role, user, canManage]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage prospective leads and status progression.
          </p>
        </div>

        {canManage && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddOpen(true)}
            className="!bg-black !text-white hover:!bg-neutral-800"
          >
            Add Lead
          </Button>
        )}
      </div>

      <TextInput
        placeholder="Search leads..."
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
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={columns}
            data={filteredLeads}
            loading={loading}
            emptyMessage="No leads found."
            enableGlobalFilter={false}
            enableTopToolbar={false}
            enableBottomToolbar={false}
            enablePagination={false}
          />
        </CardContent>
      </Card>

      <AddLeadDialog
        opened={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          loadLeads();
        }}
      />
    </div>
  );
}