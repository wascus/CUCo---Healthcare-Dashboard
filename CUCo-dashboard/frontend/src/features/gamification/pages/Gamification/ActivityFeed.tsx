import { CheckCircle as CheckCircleIcon, Notes as NotesIcon, LocalFlorist as SproutIcon } from "@mui/icons-material";

interface ActivityFeedProps {
  completedTasksCount: number;
  taskPoints: number;
  diaryCount: number;
  journalPoints: number;
}

export default function ActivityFeed({ 
  completedTasksCount, 
  taskPoints, 
  diaryCount, 
  journalPoints 
}: ActivityFeedProps) {
  return (
    <div className="activity-feed">
      <h3 className="activity-feed-title">Recent Activity</h3>
      <div className="activity-items">
        {completedTasksCount > 0 && (
          <div className="activity-item">
            <span className="activity-icon"><CheckCircleIcon /></span>
            <span className="activity-text">Completed {completedTasksCount} task{completedTasksCount !== 1 ? 's' : ''}</span>
            <span className="activity-time">Total: {taskPoints} pts</span>
          </div>
        )}
        {diaryCount > 0 && (
          <div className="activity-item">
            <span className="activity-icon"><NotesIcon /></span>
            <span className="activity-text">Wrote {diaryCount} journal {diaryCount !== 1 ? 'entries' : 'entry'}</span>
            <span className="activity-time">Total: {journalPoints} pts</span>
          </div>
        )}
        {completedTasksCount === 0 && diaryCount === 0 && (
          <div className="activity-item">
            <span className="activity-icon"><SproutIcon /></span>
            <span className="activity-text">Start your journey by writing a journal entry or completing a task!</span>
            <span className="activity-time"></span>
          </div>
        )}
      </div>
    </div>
  );
}