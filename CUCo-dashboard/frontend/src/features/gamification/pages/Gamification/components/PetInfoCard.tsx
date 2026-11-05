import { useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import { Settings as SettingsIcon, Close as CloseIcon, Construction as ConstructionIcon, Pets as PetsIcon, Star as StarIcon, EmojiEmotions as EmojiEmotionsIcon, SportsEsports as SportsEsportsIcon, Notes as NotesIcon, CheckCircle as CheckCircleIcon, ChatBubbleOutline as BubbleIcon, Landscape as LandscapeIcon, Lightbulb as LightbulbIcon } from "@mui/icons-material";
import { getMoodText } from '../calculations';
import { usePet } from '../../../PetContext';

interface PetInfoCardProps {
  petName: string;
  energyPoints: number;
  petHappiness: number;
  diaryCount: number;
  completedTasksCount: number;
  emotionCount: number;
  topicCount: number;
  onNameChange: (name: string) => void;
  onPlayWithPet: () => void;
}

export default function PetInfoCard({
  petName,
  energyPoints,
  petHappiness,
  diaryCount,
  completedTasksCount,
  emotionCount,
  topicCount,
  onNameChange,
  onPlayWithPet,
}: PetInfoCardProps) {
  const { addEnergy } = usePet();
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showHappinessTooltip, setShowHappinessTooltip] = useState(false);
  const [happinessTooltipPosition, setHappinessTooltipPosition] = useState<"below" | "above">("below");
  const [showPlayTooltip, setShowPlayTooltip] = useState(false);

  const handleEditName = () => {
    setTempName(petName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setTempName("");
  };

  const handleHappinessMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const tooltipHeight = 200;
    const offset = 12;
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    
    setHappinessTooltipPosition(spaceBelow < tooltipHeight + offset ? "above" : "below");
    setShowHappinessTooltip(true);
  };

  const handlePlayButtonMouseEnter = () => {
    if (petHappiness < 30) {
      setShowPlayTooltip(true);
    }
  };

  const handlePlayButtonMouseLeave = () => {
    setShowPlayTooltip(false);
  };

  if (showSettings) {
    return (
      <div className="pet-info-card">
        <div className="pet-info-header">
          <h3 className="pet-name"><SettingsIcon sx={{ mr: 0.5 }} /> Settings</h3>
          <button 
            className="edit-name-button"
            onClick={() => setShowSettings(false)}
            data-testid="button-close-settings"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h4 className="settings-title">Pet Name</h4>
            {!isEditingName ? (
              <div className="settings-item">
                <p className="settings-value">{petName}</p>
                <button 
                  className="settings-button"
                  onClick={handleEditName}
                  data-testid="button-edit-name"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="settings-item">
                <input
                  type="text"
                  autoComplete="off"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="name-input"
                  data-testid="input-pet-name"
                  maxLength={20}
                  autoFocus
                />
                <button 
                  className="settings-button"
                  onClick={handleSaveName}
                  data-testid="button-save-name"
                >
                  Save
                </button>
                <button 
                  className="settings-button secondary"
                  onClick={handleCancelEdit}
                  data-testid="button-cancel-name"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="settings-section">
            <h4 className="settings-title">Pet Appearance</h4>
            <div className="settings-item">
              <p className="settings-value coming-soon"><ConstructionIcon sx={{ mr: 0.5 }} /> Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pet-info-card">
      <div className="pet-info-header">
        <h3 className="pet-name" data-testid="pet-name"><PetsIcon sx={{ mr: 0.5 }} /> {petName}</h3>
        <button 
          className="edit-name-button"
          onClick={() => setShowSettings(true)}
          data-testid="button-settings"
        >
          <SettingsIcon />
        </button>
      </div>

      <div className="pet-info-stats">

        <div className="info-stat-row">
          <span className="info-stat-label"><StarIcon sx={{ mr: 0.5 }} /> Energy</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="info-stat-value" data-testid="pet-energy">{energyPoints}</span>
            {import.meta.env.DEV && (
              <button 
                onClick={() => addEnergy(50)} 
                style={{ 
                  padding: '2px 6px', 
                  fontSize: '10px', 
                  cursor: 'pointer',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                title="Debug: Add 50 energy"
              >
                +50
              </button>
            )}
          </div>
        </div>

        <div className="info-stat-row">
          <span className="info-stat-label"><EmojiEmotionsIcon sx={{ mr: 0.5 }} /> Mood</span>
          <span className="info-stat-value">{getMoodText(petHappiness)}</span>
        </div>
      </div>

      <div className="pet-info-progress">
        <div className="progress-label">
          <div className="happiness-label-container">
            <span>Happiness</span>
            <div 
              className="info-icon-wrapper"
              onMouseEnter={handleHappinessMouseEnter}
              onMouseLeave={() => setShowHappinessTooltip(false)}
            >
              <button 
                className="info-icon-button" 
                aria-label="Learn how happiness works"
                type="button"
              >
                <InfoIcon sx={{ fontSize: "1.3rem" }} />
              </button>
              {showHappinessTooltip && (
                <div className={`happiness-tooltip happiness-tooltip-${happinessTooltipPosition}`}>
                  <h4>How Happiness Works</h4>
                  <ul>
                    <li>Start with a baseline of <strong>15%</strong> happiness</li>
                    <li>Each item placed in the pet's room adds <strong>5%</strong> happiness</li>
                    <li>Buy items from the shop using energy points to increase happiness</li>
                    <li>Maximum happiness is capped at <strong>100%</strong></li>
                    <li>Happiness affects your pet's mood and animations</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <span>{petHappiness}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${petHappiness}%` }}
          />
        </div>
      </div>

      <div className="pet-info-actions">
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={handlePlayButtonMouseEnter}
          onMouseLeave={handlePlayButtonMouseLeave}
        >
          <button 
            className="play-button"
            onClick={onPlayWithPet}
            disabled={petHappiness < 30}
            data-testid="button-play"
          >
            <SportsEsportsIcon sx={{ mr: 0.5 }} /> Play
          </button>
          {showPlayTooltip && petHappiness < 30 && (
            <div className="play-button-tooltip">
              Pet's happiness is too low (&lt;30%). Increase happiness to play!
            </div>
          )}
        </div>
      </div>

      <div className="pet-info-summary">
        <div className="summary-item">
          <span className="summary-icon"><NotesIcon /></span>
          <span className="summary-text">{diaryCount} journals</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon"><CheckCircleIcon /></span>
          <span className="summary-text">{completedTasksCount} tasks</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon"><BubbleIcon /></span>
          <span className="summary-text">{emotionCount} emotions</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon"><LandscapeIcon /></span>
          <span className="summary-text">{topicCount} topics</span>
        </div>
      </div>

      <div className="pet-tips-section">
        <div className="tips-header">
          <span className="tips-icon"><LightbulbIcon /></span>
          <span className="tips-title">Tips & Hints</span>
        </div>
        <div className="tips-content" data-testid="pet-tips">
          <p className="tip-text">
            • Buy items from the shop to customize your pet's environment!
          </p>
        </div>
      </div>
    </div>
  );
}
