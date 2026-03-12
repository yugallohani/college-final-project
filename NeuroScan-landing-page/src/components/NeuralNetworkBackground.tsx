import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
}

interface Pulse {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

const NeuralNetworkBackground = () => {
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

    // Create nodes (neurons)
    const nodeCount = 40;
    const nodes: Node[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        connections: []
      });
    }

    // Create connections between nearby nodes
    const maxDistance = 200;
    nodes.forEach((node, i) => {
      nodes.forEach((otherNode, j) => {
        if (i !== j) {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance && node.connections.length < 3) {
            node.connections.push(j);
          }
        }
      });
    });

    // Pulses traveling through connections
    const pulses: Pulse[] = [];
    
    const createPulse = () => {
      const nodeIndex = Math.floor(Math.random() * nodes.length);
      const node = nodes[nodeIndex];
      
      if (node.connections.length > 0) {
        const targetIndex = node.connections[Math.floor(Math.random() * node.connections.length)];
        pulses.push({
          from: nodeIndex,
          to: targetIndex,
          progress: 0,
          speed: 0.01 + Math.random() * 0.02
        });
      }
    };

    // Create initial pulses
    for (let i = 0; i < 5; i++) {
      createPulse();
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      nodes.forEach((node) => {
        // Move nodes
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));

        // Draw node (very subtle)
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.15)"; // Subtle purple
        ctx.fill();

        // Draw glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 6);
        gradient.addColorStop(0, "rgba(139, 92, 246, 0.1)");
        gradient.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Draw connections
      nodes.forEach((node, i) => {
        node.connections.forEach((targetIndex) => {
          const target = nodes[targetIndex];
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            
            // Opacity based on distance
            const opacity = (1 - distance / maxDistance) * 0.08;
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // Update and draw pulses
      pulses.forEach((pulse, index) => {
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(index, 1);
          // Create new pulse occasionally
          if (Math.random() < 0.3) {
            createPulse();
          }
          return;
        }

        const fromNode = nodes[pulse.from];
        const toNode = nodes[pulse.to];

        const x = fromNode.x + (toNode.x - fromNode.x) * pulse.progress;
        const y = fromNode.y + (toNode.y - fromNode.y) * pulse.progress;

        // Draw pulse
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        const pulseGradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
        pulseGradient.addColorStop(0, "rgba(167, 139, 250, 0.6)");
        pulseGradient.addColorStop(1, "rgba(167, 139, 250, 0)");
        ctx.fillStyle = pulseGradient;
        ctx.fill();

        // Draw trail
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        const trailGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        trailGradient.addColorStop(0, "rgba(167, 139, 250, 0.2)");
        trailGradient.addColorStop(1, "rgba(167, 139, 250, 0)");
        ctx.fillStyle = trailGradient;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default NeuralNetworkBackground;
