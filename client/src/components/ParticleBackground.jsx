import { useMemo } from 'react';

function ParticleBackground({ color = 'white', count = 20 }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 6 + 4,
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.1,
    }));
  }, [count]);

  return (
    <div className="particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            width: particle.size,
            height: particle.size,
            background: color === 'white'
              ? `rgba(255, 255, 255, ${particle.opacity})`
              : `rgba(70, 23, 143, ${particle.opacity})`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default ParticleBackground;
