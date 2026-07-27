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
import EditLeadDialog from '../components/EditLeadDialog';

// Delete Dialog using Shadcn UI AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [editLead, setEditLead] = useState(null);
  const [deleteLead, setDeleteLead] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await leadsApi.getAll();
      const normalized =
        Array.isArray(res) ? res :
        Array.isArray(res?.items) ? res.items :
        Array.isArray(res?.data) ? res.data :
        [];
      setLeads(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const q = globalFilter.toLowerCase().trim();
    if (!q) return leads;

    return leads.filter((lead) =>
      [lead.contactName, lead.email, lead.phone, lead.companyName, lead.status, lead.source]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [leads, globalFilter]);

  const handleView = (lead) => navigate(`/leads/${lead.id}`);

  const handleStatusChange = async (lead, nextStatus) => {
    if (!nextStatus || nextStatus === lead.status) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: nextStatus } : l))
    );

    try {
      await leadsApi.update(lead.id, { status: nextStatus });
    } catch (err) {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l))
      );
      setError(err.message || 'Failed to update lead status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteLead) return;
    setIsDeleting(true);
    try {
      await leadsApi.remove(deleteLead.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteLead.id));
      setDeleteLead(null);
    } catch (err) {
      setError(err.message || 'Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = getLeadColumns({
    onView: handleView,
    onEdit: setEditLead,
    onDelete: setDeleteLead,
    onStatusChange: handleStatusChange,
    canManage,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage prospective leads, update statuses, and edit customer records.
          </p>
        </div>

        {canManage && (
          <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddOpen(true)}
                className="!bg-black !text-white hover:!bg-neutral-800"
                >Add Lead</Button>
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

      {editLead ? (
        <EditLeadDialog
          opened={true}
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSuccess={() => {
            setEditLead(null);
            loadLeads();
          }}
        />
      ) : null}

      {/* Shadcn UI Delete Dialog */}
      <AlertDialog open={!!deleteLead} onOpenChange={(open) => !open && setDeleteLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {deleteLead?.contactName || 'this lead'}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}