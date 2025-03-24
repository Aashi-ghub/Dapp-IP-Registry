'use client';

import Image from "next/image";
import { Shield, Lock, FileCheck } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FeatureImageProps {
  className?: string;
  iconType?: 'shield' | 'lock' | 'file';
  animate?: boolean;
}

export default function FeatureImage({ 
  className, 
  iconType = 'shield',
  animate = true
}: FeatureImageProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Handle mouse movement for 3D effect
  useEffect(() => {
    if (!animate) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      
      // Limit the tilt effect
      setRotation({ 
        x: y * -5, // Reversed for natural feel
        y: x * 5 
      });
    };

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    containerRef.current?.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [animate]);

  const renderIcon = () => {
    const iconClass = "h-12 w-12 text-white";
    
    switch (iconType) {
      case 'lock':
        return <Lock className={iconClass} />;
      case 'file':
        return <FileCheck className={iconClass} />;
      default:
        return <Shield className={iconClass} />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full aspect-square transition-all duration-300",
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Background with glow effect */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-lg transition-all duration-300 rounded-xl overflow-hidden",
          "bg-gradient-to-br from-primary/40 via-blue-500/30 to-purple-500/40",
          "shadow-lg shadow-primary/20",
          loaded ? "opacity-100" : "opacity-0",
          animate && "animate-pulse-slow"
        )}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-20"></div>
        
        {/* Animated border glow */}
        <div className="absolute inset-0 gradient-border rounded-xl"></div>
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center transform -translate-z-20">
          {renderIcon()}
        </div>
      </div>
      
      {/* Actual image */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-500 transform translate-z-10",
          loaded ? "opacity-100" : "opacity-0"
        )}
      >
        <Image
          src="/feature-graphic.png"
          alt="Platform Features"
          fill
          className="object-contain p-4 drop-shadow-lg"
          priority
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            setLoaded(true);
          }}
        />
      </div>
      
      {/* Loading indicator */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
} 