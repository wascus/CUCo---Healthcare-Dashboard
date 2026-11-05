import "./ActivityOverview.css";
import { useState, useEffect } from "react";
import { 
  useTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask, 
  type TaskDTO, 
  type TaskPriority 
} from "../../../../services/tasks";
import { TASK_POINTS } from "../Gamification/constants";
import { getMultiplier } from "../../../../services/streak";
import { usePet } from "../../PetContext";
import TaskModal from "./TaskModal";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FlagIcon from "@mui/icons-material/Flag";

const mapFromBackendPriority = (p: TaskPriority): 'low' | 'medium' | 'high' => {
  switch (p) {
    case 'LOW': return 'low';
    case 'HIGH': return 'high';
    default: return 'medium';
  }
};



export default function ActivityOverview() {
  const { data: tasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { addEnergy } = usePet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionNotification, setCompletionNotification] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1.0);

  // Fetch multiplier on mount
  useEffect(() => {
    const fetchMultiplier = async () => {
      try {
        const response = await getMultiplier();
        setMultiplier(response.multiplier);
      } catch (error) {
        console.error('Error fetching multiplier:', error);
        setMultiplier(1.0);
      }
    };
    fetchMultiplier();
  }, []);

  const handleModalSubmit = async (taskData: { title: string; description?: string; priority: TaskPriority; taskType: TaskDTO['taskType']; scheduledDate?: string; scheduledTime?: string }) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          taskType: taskData.taskType,
          scheduledDate: taskData.scheduledDate,
          scheduledTime: taskData.scheduledTime,
        });
        setEditingTask(null);
      } else {
        await createTask.mutateAsync({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          taskType: taskData.taskType,
          scheduledDate: taskData.scheduledDate,
          scheduledTime: taskData.scheduledTime,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (task: TaskDTO) => {
    const nextCompleted = !task.completed;
    
    if (nextCompleted) {
      const priority = mapFromBackendPriority(task.priority);
      const basePoints = TASK_POINTS[priority];
      const earnedPoints = Math.floor(basePoints * multiplier);
      addEnergy(earnedPoints);
      setCompletionNotification(`+${earnedPoints} pts earned!`);
      setTimeout(() => setCompletionNotification(null), 3000);
    }
    
    try {
      await updateTask.mutateAsync({
        id: task.id,
        completed: nextCompleted,
      });
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleEdit = (task: TaskDTO) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId);
    }
  };

  const shortTermTasks = tasks.filter(task => task.taskType === 'SHORT_TERM');
  const longTermTasks = tasks.filter(task => task.taskType === 'LONG_TERM');
  
  const completedShortTermTasks = shortTermTasks.filter(task => task.completed);
  const pendingShortTermTasks = shortTermTasks
    .filter(task => !task.completed)
    .sort((a, b) => {
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  
  const completedLongTermTasks = longTermTasks.filter(task => task.completed);
  const pendingLongTermTasks = longTermTasks.filter(task => !task.completed);

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <p className="empty-state-subtitle">Loading your activities…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="activity-header">
        <div className="header-top">
          <div>
            <h2 className="activity-title">My Tasks</h2>
            <p className="activity-description">
              Organize your life into short-term tasks and long-term goals. Take one step at a time 
              and celebrate every milestone on your journey.
            </p>
          </div>
          <button 
            className="add-task-button"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            data-testid="button-add-task"
          >
            + Add Task
          </button>
        </div>
      </header>

      {/* Completion Notification */}
      {completionNotification && (
        <div className="completion-notification" data-testid="completion-notification">
          {completionNotification}
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editingTask={editingTask}
        isSubmitting={isSubmitting}
      />

      {/* Tasks Display */}
      {tasks.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          <p className="empty-state-title">No tasks yet</p>
          <p className="empty-state-subtitle">
            Add your first task above to start tracking your activities and goals.
          </p>
        </div>
      ) : (
        <div className="tasks-container">
          {/* Short-term Tasks */}
          {shortTermTasks.length > 0 && (
            <div className="task-category">
              <h2 className="category-title"><CalendarTodayIcon sx={{ marginRight: 1, fontSize: '1.4em', verticalAlign: 'middle' }} />Short-term Tasks</h2>
              
              {/* Short-term Pending */}
              <div className="task-section">
                <h3 className="section-title">Scheduled ({pendingShortTermTasks.length})</h3>
                <div className="task-list" data-testid="pending-short-term-tasks">
                  {pendingShortTermTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={() => handleToggleComplete(task)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {pendingShortTermTasks.length === 0 && (
                    <p className="empty-section">No scheduled tasks</p>
                  )}
                </div>
              </div>
              
              {/* Short-term Completed */}
              <div className="task-section">
                <h3 className="section-title">Completed ({completedShortTermTasks.length})</h3>
                <div className="task-list" data-testid="completed-short-term-tasks">
                  {completedShortTermTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={() => handleToggleComplete(task)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {completedShortTermTasks.length === 0 && (
                    <p className="empty-section">No completed tasks</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Long-term Tasks */}
          {longTermTasks.length > 0 && (
            <div className="task-category">
              <h2 className="category-title"><FlagIcon sx={{ marginRight: 1, fontSize: '1.4em', verticalAlign: 'middle' }} />Long-term Goals</h2>
              
              {/* Long-term Pending */}
              <div className="task-section">
                <h3 className="section-title">In Progress ({pendingLongTermTasks.length})</h3>
                <div className="task-list" data-testid="pending-long-term-tasks">
                  {pendingLongTermTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={() => handleToggleComplete(task)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {pendingLongTermTasks.length === 0 && (
                    <p className="empty-section">No goals in progress</p>
                  )}
                </div>
              </div>
              
              {/* Long-term Completed */}
              <div className="task-section">
                <h3 className="section-title">Completed ({completedLongTermTasks.length})</h3>
                <div className="task-list" data-testid="completed-long-term-tasks">
                  {completedLongTermTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={() => handleToggleComplete(task)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {completedLongTermTasks.length === 0 && (
                    <p className="empty-section">No completed goals</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
}

// Task Item Component
interface TaskItemProps {
  task: TaskDTO;
  onToggle: (id: string) => void;
  onEdit: (task: TaskDTO) => void;
  onDelete: (id: string) => void;
}

function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const priority = mapFromBackendPriority(task.priority);
  
  const formatScheduledDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (timeStr) {
      return `${formatted} at ${timeStr}`;
    }
    return formatted;
  };

  return (
    <div 
      className={`task-item ${task.completed ? 'completed' : ''} priority-${priority}`}
      data-testid={`task-${task.id}`}
    >
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          data-testid={`checkbox-${task.id}`}
        />
      </div>

      <div className="task-content">
        <div className="task-header">
          <h4 className="task-title" data-testid={`task-title-${task.id}`}>
            {task.title}
          </h4>
          <span className="task-points" data-testid={`task-points-${task.id}`}>
            +{TASK_POINTS[priority]} pts
          </span>
        </div>
        {task.description && (
          <p className="task-description" data-testid={`task-description-${task.id}`}>
            {task.description}
          </p>
        )}
        {task.taskType === 'SHORT_TERM' && task.scheduledDate && (
          <p className="task-scheduled" data-testid={`task-scheduled-${task.id}`}>
            <CalendarTodayIcon sx={{ fontSize: '0.85em', verticalAlign: 'middle', marginRight: 0.5 }} />
            {formatScheduledDate(task.scheduledDate, task.scheduledTime)}
          </p>
        )}
      </div>

      <div className="task-actions">
        <button 
          onClick={() => onEdit(task)}
          className="action-button edit"
          data-testid={`button-edit-task-${task.id}`}
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(task.id)}
          className="action-button delete"
          data-testid={`button-delete-task-${task.id}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
