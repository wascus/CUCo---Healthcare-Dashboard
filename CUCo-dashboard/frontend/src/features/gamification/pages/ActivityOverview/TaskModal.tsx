import { useState } from "react";
import { type TaskDTO, type TaskPriority, type TaskTypeEnum } from "../../../../services/tasks";
import { TASK_POINTS } from "../Gamification/constants";
import "./TaskModal.css";

const mapToBackendPriority = (p: string): TaskPriority => {
  switch (p) {
    case 'low': return 'LOW';
    case 'high': return 'HIGH';
    default: return 'MEDIUM';
  }
};

const mapFromBackendPriority = (p: TaskPriority): 'low' | 'medium' | 'high' => {
  switch (p) {
    case 'LOW': return 'low';
    case 'HIGH': return 'high';
    default: return 'medium';
  }
};

const mapFromBackendTaskType = (t: TaskTypeEnum): 'short' | 'long' => {
  return t === 'SHORT_TERM' ? 'short' : 'long';
};

const mapToBackendTaskType = (t: string): TaskTypeEnum => {
  return t === 'short' ? 'SHORT_TERM' : 'LONG_TERM';
};

interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  taskType: TaskTypeEnum;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData) => Promise<void>;
  editingTask?: TaskDTO | null;
  isSubmitting: boolean;
}

export default function TaskModal({ isOpen, onClose, onSubmit, editingTask, isSubmitting }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: editingTask?.title || "",
    description: editingTask?.description || "",
    priority: editingTask ? mapFromBackendPriority(editingTask.priority) : 'medium' as 'low' | 'medium' | 'high',
    taskType: editingTask ? mapFromBackendTaskType(editingTask.taskType) : 'long' as 'short' | 'long',
    scheduledDate: editingTask?.scheduledDate ? new Date(editingTask.scheduledDate).toISOString().split('T')[0] : "",
    scheduledTime: editingTask?.scheduledTime || "",
  });
  const [errors, setErrors] = useState({ title: "" });

  const validateForm = () => {
    const newErrors = { title: "" };
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title should be at least 3 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData: TaskFormData = {
      priority: mapToBackendPriority(formData.priority),
      taskType: mapToBackendTaskType(formData.taskType),
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
    };

    if (formData.taskType === 'short' && formData.scheduledDate) {
      submitData.scheduledDate = new Date(formData.scheduledDate).toISOString();
      if (formData.scheduledTime) {
        submitData.scheduledTime = formData.scheduledTime;
      }
    }

    await onSubmit(submitData);

    if (!isSubmitting) {
      setFormData({ title: "", description: "", priority: 'medium', taskType: 'long', scheduledDate: "", scheduledTime: "" });
      setErrors({ title: "" });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              autoComplete="off"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                if (errors.title) setErrors({ title: "" });
              }}
              placeholder="e.g., Call therapist, Take a walk, Write in journal..."
              className={`form-input ${errors.title ? 'error' : ''}`}
              data-testid="input-task-title"
            />
            {errors.title && (
              <div className="error-message" data-testid="error-title">
                {errors.title}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this task..."
              className="form-textarea"
              rows={3}
              data-testid="textarea-task-description"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task Type</label>
            <select
              value={formData.taskType}
              onChange={(e) => setFormData(prev => ({ ...prev, taskType: e.target.value as 'short' | 'long' }))}
              className="form-select"
              data-testid="select-task-type"
            >
              <option value="long">Long-term Goal (no specific date)</option>
              <option value="short">Short-term Task (scheduled for a specific time)</option>
            </select>
          </div>

          {formData.taskType === 'short' && (
            <>
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="form-input"
                  data-testid="input-scheduled-date"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Time (optional)</label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="form-input"
                  data-testid="input-scheduled-time"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
              className="form-select"
              data-testid="select-task-priority"
            >
              <option value="low">Low ({TASK_POINTS.low} pts)</option>
              <option value="medium">Medium ({TASK_POINTS.medium} pts)</option>
              <option value="high">High ({TASK_POINTS.high} pts)</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="modal-button primary"
              data-testid="button-save-task"
            >
              {isSubmitting ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
