import { useEffect, useRef } from "react";

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    resize();
    window.addEventListener("resize", resize);

    let mouse = { x: width / 2, y: height / 2 };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    window.addEventListener("mousemove", handleMouseMove);

    class Neuron {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulsePhase: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.15; // Reduced from 0.3
        this.vy = (Math.random() - 0.5) * 0.15; // Reduced from 0.3
        this.radius = Math.random() * 2 + 1.5;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      move() {
        // Simple drift movement
        this.x += this.vx;
        this.y += this.vy;

        // Add some random movement for organic feel (reduced)
        this.vx += (Math.random() - 0.5) * 0.001; // Reduced from 0.002
        this.vy += (Math.random() - 0.5) * 0.001; // Reduced from 0.002

        // Mouse interaction - gentle repel
        const mouseDx = mouse.x - this.x;
        const mouseDy = mouse.y - this.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        
        if (mouseDist < 100) {
          const repelForce = 0.001; // Reduced from 0.002
          this.vx -= (mouseDx / mouseDist) * repelForce;
          this.vy -= (mouseDy / mouseDist) * repelForce;
        }

        // Boundary bounce
        if (this.x < 0 || this.x > width) this.vx *= -0.8;
        if (this.y < 0 || this.y > height) this.vy *= -0.8;
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));

        // Gentle damping (increased for slower movement)
        this.vx *= 0.998; // Increased from 0.995
        this.vy *= 0.998; // Increased from 0.995

        this.pulsePhase += 0.02; // Reduced from 0.03
      }

      draw(time: number) {
        const pulse = Math.sin(this.pulsePhase) * 0.4 + 0.6;
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 4);
        outerGlow.addColorStop(0, `hsla(243, 75%, 65%, ${0.12 * pulse})`);
        outerGlow.addColorStop(0.5, `hsla(270, 60%, 60%, ${0.08 * pulse})`);
        outerGlow.addColorStop(1, "transparent");
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Middle glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        const middleGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        middleGlow.addColorStop(0, `hsla(243, 80%, 70%, ${0.25 * pulse})`);
        middleGlow.addColorStop(1, "transparent");
        ctx.fillStyle = middleGlow;
        ctx.fill();

        // Core neuron body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(243, 75%, 75%, ${0.4 * pulse})`;
        ctx.fill();

        // Bright center highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.2, this.y - this.radius * 0.2, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(243, 90%, 85%, ${0.3 * pulse})`;
        ctx.fill();
      }
    }

    class Pulse {
      x: number;
      y: number;
      tx: number;
      ty: number;
      progress: number;
      cx: number;
      cy: number;
      intensity: number;
      size: number;

      constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x = x1;
        this.y = y1;
        this.tx = x2;
        this.ty = y2;
        this.progress = 0;
        this.cx = x1;
        this.cy = y1;
        this.intensity = Math.random() * 0.5 + 0.5;
        this.size = Math.random() * 2 + 2;
      }

      move() {
        this.progress += 0.02;
        this.cx = this.x + (this.tx - this.x) * this.progress;
        this.cy = this.y + (this.ty - this.y) * this.progress;
      }

      draw() {
        const alpha = Math.sin(this.progress * Math.PI) * this.intensity * 0.8; // Brighter shooting pulses
        
        // Outer glow (more visible shooting effect)
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, this.size * 3, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.size * 3);
        outerGlow.addColorStop(0, `hsla(270, 80%, 75%, ${alpha * 0.8})`);
        outerGlow.addColorStop(0.5, `hsla(270, 70%, 65%, ${alpha * 0.4})`);
        outerGlow.addColorStop(1, "transparent");
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Middle glow (shooting trail)
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, this.size * 1.5, 0, Math.PI * 2);
        const middleGlow = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.size * 1.5);
        middleGlow.addColorStop(0, `hsla(270, 90%, 85%, ${alpha})`);
        middleGlow.addColorStop(1, "transparent");
        ctx.fillStyle = middleGlow;
        ctx.fill();

        // Core pulse (bright shooting star)
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, this.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(270, 100%, 95%, ${alpha})`;
        ctx.fill();
      }
    }

    const neurons: Neuron[] = [];
    const pulses: Pulse[] = [];
    const neuronCount = 60; // Reduced from 100

    // Initialize neurons
    for (let i = 0; i < neuronCount; i++) {
      neurons.push(new Neuron());
    }

    function drawConnections() {
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const dx = neurons[i].x - neurons[j].x;
          const dy = neurons[i].y - neurons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.25; // More visible connections
            
            ctx.beginPath();
            ctx.moveTo(neurons[i].x, neurons[i].y);
            ctx.lineTo(neurons[j].x, neurons[j].y);
            ctx.strokeStyle = `hsla(243, 75%, 65%, ${alpha})`;
            ctx.lineWidth = 0.6; // Thicker lines
            ctx.stroke();

            // More frequent shooting pulses
            if (Math.random() < 0.002) {
              pulses.push(new Pulse(neurons[i].x, neurons[i].y, neurons[j].x, neurons[j].y));
            }
          }
        }
      }
    }

    function drawOrbAttractor() {
      // Removed the bright blue center circle
      // The orb itself will be the visual center
    }

    let animationId: number;
    
    function animate(time: number) {
      ctx.clearRect(0, 0, width, height);
      
      drawOrbAttractor();
      
      neurons.forEach(neuron => {
        neuron.move();
        neuron.draw(time);
      });
      
      drawConnections();
      
      pulses.forEach((pulse, index) => {
        pulse.move();
        pulse.draw();
        
        if (pulse.progress >= 1) {
          pulses.splice(index, 1);
        }
      });
      
      animationId = requestAnimationFrame(animate);
    }

    animate(0);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="neural-bg"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none"
      }}
    />
  );
}