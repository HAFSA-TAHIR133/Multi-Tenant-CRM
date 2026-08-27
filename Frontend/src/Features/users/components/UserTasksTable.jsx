import { Table, Badge as MantineBadge, Text } from '@mantine/core';

export default function UserTasksTable({ tasks = [], loading }) {
  if (loading) {
    return (
      <Text size="sm" color="dimmed" align="center" py="md">
        Loading tasks...
      </Text>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Text size="sm" color="dimmed" align="center" py="md">
        No tasks assigned to this user.
      </Text>
    );
  }

  const rows = tasks.map((task) => (
    <tr key={task.id || task._id}>
      <td>{task.title || '-'}</td>
      <td>
        <MantineBadge color={task.status === 'completed' ? 'green' : 'yellow'}>
          {task.status || 'pending'}
        </MantineBadge>
      </td>
      <td>
        <MantineBadge
          color={
            task.priority === 'high'
              ? 'red'
              : task.priority === 'normal'
              ? 'blue'
              : 'gray'
          }
        >
          {task.priority || 'low'}
        </MantineBadge>
      </td>
      <td>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
      </td>
    </tr>
  ));

  return (
    <Table highlightOnHover withBorder withColumnBorders>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  );
}