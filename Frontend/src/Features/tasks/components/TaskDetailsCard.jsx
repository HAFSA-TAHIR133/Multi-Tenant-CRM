import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Building2 } from "lucide-react";

export default function TaskDetailsCard({ task }) {
  if (!task) return null;

  const lead = task.lead;
  const leadName =
    lead?.contactName ||
    lead?.companyName ||
    lead?.name ||
    lead?.title ||
    (lead?.id ? `Lead #${lead.id}` : null);

  const leadOwner = lead?.assignedUser;
  const leadOwnerName = leadOwner?.name || leadOwner?.fullName || null;

  const assignedUser = task.assignedUser;
  const assignedUserName = assignedUser?.name || assignedUser?.fullName || null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">Status:</span>
          <Badge variant="outline">{task.status || "Pending"}</Badge>
          <Badge variant="secondary">{task.priority || "Normal"}</Badge>
        </div>

        {/* Associated Lead */}
        {leadName && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Lead:</span>
            <span>{leadName}</span>
            {lead?.pipeline?.name && (
              <Badge variant="outline" className="ml-1">
                {lead.pipeline.name}
              </Badge>
            )}
          </div>
        )}

        {/* Assigned Task User */}
        {assignedUserName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Assigned To:</span>
            <Badge
              variant="outline"
              className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
            >
              {assignedUserName}
            </Badge>
          </div>
        )}

        {/* Lead Owner */}
        {leadOwnerName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Lead Owner:</span>
            <Badge
              variant="outline"
              className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900"
            >
              {leadOwnerName}
            </Badge>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Due Date:</span>
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {task.description && (
          <div>
            <div className="font-medium mb-1">Description:</div>
            <div
              className="prose prose-sm dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
