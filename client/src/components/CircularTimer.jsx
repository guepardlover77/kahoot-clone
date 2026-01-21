function CircularTimer({ timeLeft, totalTime, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progress);

  const isWarning = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  const getColor = () => {
    if (isCritical) return '#e21b3c';
    if (isWarning) return '#d89e00';
    return '#46178f';
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${
        isWarning ? 'animate-timer-pulse' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {/* Background glow effect */}
      {isWarning && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${isCritical ? 'rgba(226, 27, 60, 0.3)' : 'rgba(216, 158, 0, 0.3)'} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* SVG Timer */}
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 linear"
          style={{
            filter: isWarning ? `drop-shadow(0 0 10px ${getColor()})` : 'none',
          }}
        />
      </svg>

      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`font-bold text-white transition-all duration-300 ${
            isCritical ? 'text-4xl animate-countdown' : isWarning ? 'text-3xl' : 'text-2xl'
          }`}
          key={timeLeft}
          style={{
            textShadow: isWarning ? `0 0 20px ${getColor()}` : 'none',
          }}
        >
          {timeLeft}
        </span>
      </div>

      {/* Tick marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const innerRadius = radius - 15;
        const outerRadius = radius - 10;
        return (
          <div
            key={i}
            className="absolute bg-white/30"
            style={{
              width: 2,
              height: 5,
              left: size / 2 + Math.cos(angle - Math.PI / 2) * ((innerRadius + outerRadius) / 2) - 1,
              top: size / 2 + Math.sin(angle - Math.PI / 2) * ((innerRadius + outerRadius) / 2) - 2.5,
              transform: `rotate(${i * 30}deg)`,
              borderRadius: 1,
            }}
          />
        );
      })}
    </div>
  );
}

export default CircularTimer;
