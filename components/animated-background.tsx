"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedBackgroundProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
}

export function AnimatedBackground({ 
  className = "fixed top-0 left-0 w-full h-full -z-10 opacity-40",
  density = 'medium' 
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)
    
    const handleMotionPreferenceChange = () => setIsReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleMotionPreferenceChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with higher resolution for retina displays
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Calculate particle count based on screen size and density setting
    const getDensityMultiplier = () => {
      switch (density) {
        case 'low': return 0.5
        case 'high': return 1.25
        default: return 0.8
      }
    }

    // Create particles
    const particlesArray: Particle[] = []
    const baseDensity = Math.min(25, window.innerWidth / 50)
    const numberOfParticles = Math.floor(baseDensity * getDensityMultiplier())

    // Colors for dark mode (we're enforcing dark mode)
    const getParticleColor = () => {
      // Blue palette for dark mode
      return `rgba(${Math.random() * 50 + 50}, ${Math.random() * 80 + 100}, ${Math.random() * 100 + 155}, ${Math.random() * 0.25 + 0.15})`
    }

    const getConnectionColor = (opacity: number) => {
      return `rgba(${76 + Math.random() * 20}, ${61 + Math.random() * 20}, ${209 + Math.random() * 46}, ${opacity * 0.35})`
    }

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
      originalSize: number
      pulse: boolean
      pulseSpeed: number

      constructor() {
        this.x = canvas ? Math.random() * window.innerWidth : 0
        this.y = canvas ? Math.random() * window.innerHeight : 0
        this.originalSize = Math.random() * 1.5 + 0.5
        this.size = this.originalSize
        this.speedX = (Math.random() - 0.5) * (isReducedMotion ? 0.1 : 0.25)
        this.speedY = (Math.random() - 0.5) * (isReducedMotion ? 0.1 : 0.25)
        this.color = getParticleColor()
        this.pulse = Math.random() > 0.6 // Reduce number of pulsing particles
        this.pulseSpeed = Math.random() * 0.006 + 0.001 // Slower pulse
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        // Gentle pulsing effect
        if (!isReducedMotion && this.pulse) {
          this.size = this.originalSize + Math.sin(Date.now() * this.pulseSpeed) * 0.2 // Less dramatic pulse
        }

        // Wrap around screen edges
        if (this.x > window.innerWidth) this.x = 0
        else if (this.x < 0) this.x = window.innerWidth

        if (this.y > window.innerHeight) this.y = 0
        else if (this.y < 0) this.y = window.innerHeight
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const init = () => {
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle())
      }
    }

    init()

    const connectParticles = () => {
      const connectionDistance = window.innerWidth < 768 ? 60 : 80
      
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x
          const dy = particlesArray[a].y - particlesArray[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance
            ctx.strokeStyle = getConnectionColor(opacity)
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y)
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      requestAnimationFrame(animate)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // If reduced motion is enabled, slow down the animation
      const updateInterval = isReducedMotion ? 3 : 1
      
      if (Date.now() % updateInterval === 0) {
        particlesArray.forEach((particle) => {
          particle.update()
          particle.draw()
        })

        connectParticles()
      }
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [density, isReducedMotion])

  return <canvas ref={canvasRef} className={className} />
}

