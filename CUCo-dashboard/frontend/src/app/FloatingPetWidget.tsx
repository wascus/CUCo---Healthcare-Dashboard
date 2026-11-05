import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pets as PetsIcon } from '@mui/icons-material';
import { usePet } from '../features/gamification/PetContext';
import PetCanvas from '../features/gamification/pages/Gamification/components/PetCanvas';
import './FloatingPetWidget.css';

export default function FloatingPetWidget() {
  const [isMinimized, setIsMinimized] = useState(true);
  const { currentAnimation, petX, petY, placedItems, petName } = usePet();

  if (isMinimized) {
    return (
      <div className="floating-pet-minimized" onClick={() => setIsMinimized(false)}>
        <span className="pet-icon"><PetsIcon /></span>
      </div>
    );
  }

  return (
    <div className="floating-pet-widget">
      <div className="floating-pet-header">
        <span className="floating-pet-name">{petName}</span>
        <div className="floating-pet-controls">
          <Link to="/individual/gamification" className="floating-pet-expand">↗</Link>
          <button onClick={() => setIsMinimized(true)} className="floating-pet-minimize">−</button>
        </div>
      </div>
      <div className="floating-pet-canvas-container">
        <PetCanvas 
          placedItems={placedItems}
          currentAnimation={currentAnimation}
          petX={petX}
          petY={petY}
          scale={0.5}
        />
      </div>
    </div>
  );
}