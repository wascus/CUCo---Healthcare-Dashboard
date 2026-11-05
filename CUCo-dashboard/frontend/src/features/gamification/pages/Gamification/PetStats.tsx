import { Bolt as BoltIcon, Notes as NotesIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";

interface PetStatsProps {
  energyPoints: number;
  journalPoints: number;
  taskPoints: number;
  diaryCount: number;
  completedTasksCount: number;
  petHappiness: number;
  moodText: string;
}

export default function PetStats({ 
  energyPoints, 
  journalPoints, 
  taskPoints, 
  diaryCount, 
  completedTasksCount, 
  petHappiness, 
  moodText 
}: PetStatsProps) {
  return (
    <div className="pet-stats">
      <div className="stat-item">
        <span className="stat-label"><BoltIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: "middle" }} /> Total Energy:</span>
        <span className="stat-value" data-testid="energy-points">{energyPoints} pts</span>
      </div>

      <div className="stat-breakdown">
        <div className="breakdown-item">
          <span className="breakdown-label"><NotesIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: "middle" }} /> From Journals:</span>
          <span className="breakdown-value" data-testid="journal-points">{journalPoints} pts ({diaryCount} entries)</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label"><CheckCircleIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: "middle" }} /> From Tasks:</span>
          <span className="breakdown-value" data-testid="task-points">{taskPoints} pts ({completedTasksCount} completed)</span>
        </div>
      </div>

      <div className="stat-item">
        <span className="stat-label">Mood:</span>
        <span className="stat-value">{moodText}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Happiness:</span>
        <div className="happiness-bar">
          <div 
            className="happiness-fill" 
            style={{ width: `${petHappiness}%` }}
          />
        </div>
        <span className="stat-value">{petHappiness}%</span>
      </div>
    </div>
  );
}