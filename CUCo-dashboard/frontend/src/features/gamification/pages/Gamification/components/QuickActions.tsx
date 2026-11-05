import { SportsEsports as SportsEsportsIcon, Lightbulb as LightbulbIcon } from "@mui/icons-material";

interface QuickActionsProps {
  onPlayWithPet: () => void;
}

export default function QuickActions({ onPlayWithPet }: QuickActionsProps) {
  return (
    <div className="actions-panel-full">
      <h3 className="panel-title">Quick Actions</h3>
      
      <div className="action-buttons-grid">
        <button 
          className="action-button primary"
          onClick={onPlayWithPet}
          data-testid="button-play-pet"
        >
          <span className="action-icon"><SportsEsportsIcon /></span>
          <div className="action-text">
            <span className="action-label">Play</span>
            <span className="action-cost">5 pts</span>
          </div>
        </button>
      </div>

      <div className="action-info">
        <p><LightbulbIcon sx={{ mr: 0.5 }} /> Earn pts by writing journal entries (50 pts) or completing tasks (10-50 pts)</p>
      </div>
    </div>
  );
}