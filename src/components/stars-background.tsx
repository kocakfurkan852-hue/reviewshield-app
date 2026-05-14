"use client";

import React, { useEffect, useRef } from 'react';

export const StarsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2;
        this.opacity = Math.random();
        this.speed = Math.random() * 0.02 + 0.005;
        const colors = ['#ffffff', '#e2e8f0', '#94a3b8', '#38bdf8', '#818cf8'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.opacity += this.speed;
        if (this.opacity > 1 || this.opacity < 0.1) {
          this.speed = -this.speed;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    class Meteor {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      width: number;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas!.width * 1.5;
        this.y = -100;
        this.length = Math.random() * 150 + 100;
        this.speed = Math.random() * 15 + 10;
        this.opacity = 0;
        this.width = Math.random() * 2 + 1;
      }

      update() {
        this.x -= this.speed;
        this.y += this.speed;
        
        if (this.opacity < 1 && this.y < canvas!.height * 0.5) {
          this.opacity += 0.05;
        } else {
          this.opacity -= 0.02;
        }

        if (this.opacity <= 0 || this.x < -200 || this.y > canvas!.height + 200) {
          this.reset();
        }
      }

      draw() {
        if (!ctx || this.opacity <= 0) return;
        ctx.save();
        const gradient = ctx.createLinearGradient(
          this.x, this.y, 
          this.x + this.length, this.y - this.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(0.1, `rgba(56, 189, 248, ${this.opacity * 0.8})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y - this.length);
        ctx.stroke();

        // Add a small glow at the head
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const init = () => {
      resize();
      stars = Array.from({ length: 150 }, () => new Star());
      meteors = Array.from({ length: 3 }, () => new Meteor());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      bgGradient.addColorStop(0, '#0f172a'); // slate-900
      bgGradient.addColorStop(1, '#020617'); // slate-950
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        star.update();
        star.draw();
      });

      // Randomly trigger meteors
      if (Math.random() < 0.005) {
        meteors.push(new Meteor());
        if (meteors.length > 5) meteors.shift();
      }

      meteors.forEach(meteor => {
        meteor.update();
        meteor.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };


    window.addEventListener('resize', resize);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
};
