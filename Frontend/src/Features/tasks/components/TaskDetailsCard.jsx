import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

export default function TaskDetailsCard({ task }) {
  if (!task) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <Badge variant="outline">{task.status || "Pending"}</Badge>
          <Badge variant="secondary">{task.priority || "Normal"}</Badge>
        </div>

        {task.assignedUser && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Assigned To:</span>
            <span>{task.assignedUser.name}</span>
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