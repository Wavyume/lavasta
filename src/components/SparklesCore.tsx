import { useEffect, useState } from "react";
import clsx from "clsx";

export const SparklesCore = ({
  id,
  className,
  background,
  minSize,
  maxSize,
  particleDensity,
  particleColor,
}: {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; animationDuration: number }>>([]);

  useEffect(() => {
    const generateParticles = () => {
      const count = particleDensity || 50;
      const newParticles = Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * ((maxSize || 2) - (minSize || 1)) + (minSize || 1),
        animationDuration: Math.random() * 3 + 2,
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, [maxSize, minSize, particleDensity]);

  return (
    <div
      id={id}
      className={clsx("relative overflow-hidden", className)}
      style={{ background: background || "transparent" }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particleColor || "#FFF",
            animationDuration: `${particle.animationDuration}s`,
            opacity: Math.random() * 0.5 + 0.3,
          }}
        />
      ))}
    </div>
  );
};
