import { useRef, useEffect, useState } from 'react';
import { ANIMATIONS, type AnimationType } from '../../features/gamification/pages/Gamification/animationConfig';
import './AnimationsDebug.css';

const animationTypes = Object.keys(ANIMATIONS) as AnimationType[];

export default function AnimationsDebug() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('idle');
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 512;
    canvas.height = 512;

    const catImage = new Image();
    const animConfig = ANIMATIONS[currentAnimation];
    catImage.src = animConfig.sprite;

    let currentFrame = 0;
    let time = 0;

    const startAnimation = () => {
      const drawScene = () => {
        ctx.fillStyle = '#fffef4';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          catImage,
          currentFrame * animConfig.frameWidth,
          0,
          animConfig.frameWidth,
          animConfig.frameHeight,
          (canvas.width - 256) / 2,
          (canvas.height - 256) / 2,
          256,
          256
        );

        if (time % animConfig.speed === 0) {
          currentFrame = (currentFrame + 1) % animConfig.frames;
        }

        time += 1;
        animationFrameRef.current = requestAnimationFrame(drawScene);
      };

      drawScene();
    };

    catImage.onload = startAnimation;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentAnimation]);

  return (
    <div className="animations-debug-page">
      <h1>Animation Debug</h1>
      
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="debug-canvas" />
        <p className="animation-label">{currentAnimation}</p>
      </div>

      <div className="buttons-grid">
        {animationTypes.map((animType) => (
          <button
            key={animType}
            className={`animation-btn ${currentAnimation === animType ? 'active' : ''}`}
            onClick={() => setCurrentAnimation(animType)}
          >
            {animType}
          </button>
        ))}
      </div>
    </div>
  );
}
