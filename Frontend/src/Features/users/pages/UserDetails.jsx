import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserDetailsCard from '../components/UserDetailsCard';
import UserProfileCard from '../components/UserProfileCard';
import UserTasksTable from '../components/UserTasksTable';
import UserActivity from '../components/UserActivity';
import { useUsers } from '../hooks/useUsers';
import { usersApi } from '../api/usersApi';
import { Link } from 'react-router-dom';
function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('auth') || 'null');
  } catch {
    return null;
  }
}

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getUserById, user, loading } = useUsers();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [activities] = useState([]); // optional, can be filled later

  const auth = getAuthUser();
  const currentUser = auth?.user;
  const currentRole = currentUser?.role;

  const isSelf = currentUser && String(user?.id) === String(currentUser.id);

// Fetch tasks for this user
useEffect(() => {
  if (!user) return;

  setTasksLoading(true);
  usersApi
    .getTasksForUser(user.id)
    .then((res) => {
      console.log('getTasksForUser raw response:', res);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      console.log('Parsed tasks list:', list);
      setTasks(list);
    })
    .catch((err) => {
      console.error('getTasksForUser error:', err);
      setTasks([]);
    })
    .finally(() => {
      setTasksLoading(false);
    });
}, [user]);

  useEffect(() => {
  if (!id) return;
  getUserById(id);
}, [id, getUserById]);

  const canView =
    currentRole === 3 || // SUPERADMIN
    currentRole === 2 || // ADMIN (backend will enforce tenant access)
    isSelf;              // USER can view own profile

  if (!id) return null;

  if (loading) {
    return <div className="p-6">Loading user...</div>;
  }

  if (!user) {
    return <div className="p-6">User not found</div>;
  }

  if (!canView) {
    return (
      <div className="p-6">
        <Button onClick={() => navigate(-1)}>Back</Button>
        <p className="mt-4 text-sm text-muted-foreground">
          You are not allowed to view this user.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Link to="/users" className="inline-block text-base text-muted-foreground hover:underline hover:text-blue-400 mb-3">
        ← Back to Users
      </Link>

      <div className="space-y-4">
        <UserDetailsCard user={user} />
        <UserProfileCard user={user} />
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Tasks</h2>
        {tasksLoading ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : (
          <UserTasksTable tasks={tasks} />
        )}
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Activity</h2>
        <UserActivity activities={activities} />
      </div>
    </div>
  );
}