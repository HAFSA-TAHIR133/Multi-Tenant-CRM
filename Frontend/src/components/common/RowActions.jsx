import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RowActions({
  onEdit,
  onDelete,
  onToggleStatus,
  status,
  showEdit = true,
  showDelete = true,
  showToggle = true,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  activeLabel = 'Deactivate',
  inactiveLabel = 'Activate',
}) {
  const isActive = status === 'active' || status === 'Active';

  return (
    <div className="flex items-center gap-1">
      {/* Edit Button */}
      {showEdit && onEdit && (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-6 gap-1 border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <Pencil className="h-3 w-3" />
          {editLabel}
        </Button>
      )}

      {/* Toggle Status Button */}
      {showToggle && onToggleStatus && (
        <Button
          variant={isActive ? 'destructive' : 'outline'}
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus();
          }}
          className={`h-6 gap-1 px-1.5 text-[10px] font-medium shadow-2xs transition-all ${
            isActive
              ? 'bg-red-100 text-red-600 border-none hover:bg-red-200/80 dark:bg-red-950/50 dark:text-red-400'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400'
          }`}
        >
          {isActive ? (
            <ToggleRight className="h-3 w-3" />
          ) : (
            <ToggleLeft className="h-3 w-3" />
          )}
          {isActive ? activeLabel : inactiveLabel}
        </Button>
      )}

      {/* Delete Button */}
      {showDelete && onDelete && (
        <Button
          variant="destructive"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-6 gap-1 bg-red-100 text-red-500 border-none hover:bg-red-200/80 px-1.5 text-[10px] font-medium dark:bg-red-950/50 dark:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}
