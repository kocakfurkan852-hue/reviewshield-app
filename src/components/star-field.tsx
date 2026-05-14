"use client";

import { useEffect, useState } from "react";

export function StarField() {
  const [stars, setStars] = useState<{ id: number; left: string; top: string; size: string; duration: string }[]>([]);
  const [meteors, setMeteors] = useState<{ id: number; left: string; top: string; duration: string; delay: string }[]>([]);

  useEffect(() => {
    // Generate stars
    const newStars = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
    }));
    setStars(newStars);

    // Generate meteors
    const newMeteors = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      duration: `${Math.random() * 5 + 10}s`,
      delay: `${Math.random() * 20}s`,
    }));
    setMeteors(newMeteors);
  }, []);

  return (
    <div className="star-container pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            // @ts-ignore
            "--duration": star.duration,
          }}
        />
      ))}
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="meteor"
          style={{
            left: meteor.left,
            top: meteor.top,
            // @ts-ignore
            "--duration": meteor.duration,
            animationDelay: meteor.delay,
          }}
        />
      ))}
    </div>
  );
}
