import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tasks');
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: number, status: Task['status']) => {
    try {
      await axios.patch(`/api/tasks/${id}`, { status });
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, status } : task
      ));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  if (loading) return <div className="loading">Loading tasks...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="task-list">
      <h2>Task Management</h2>
      {tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <div className="tasks">
          {tasks.map(task => (
            <div key={task.id} className={`task task-${task.priority}`}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div className="task-meta">
                <span className={`status status-${task.status}`}>
                  {task.status}
                </span>
                <span className={`priority priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              <div className="task-actions">
                <button 
                  onClick={() => updateTaskStatus(task.id, 'in-progress')}
                  disabled={task.status === 'completed'}
                >
                  Start
                </button>
                <button 
                  onClick={() => updateTaskStatus(task.id, 'completed')}
                  disabled={task.status === 'completed'}
                >
                  Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
