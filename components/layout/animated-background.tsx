"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function AnimatedBackground() {
  const [circles, setCircles] = useState<{ x: number; y: number; size: number; delay: number }[]>([])

  useEffect(() => {
    // Vytvoření náhodných kruhů pro animaci
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const numberOfCircles = Math.floor((windowWidth * windowHeight) / 160000) // Počet kruhů závisí na velikosti obrazovky

    const newCircles = Array.from({ length: numberOfCircles }).map(() => ({
      x: Math.random() * windowWidth,
      y: Math.random() * windowHeight,
      size: Math.random() * 200 + 50, // Velikost mezi 50 a 250px
      delay: Math.random() * 5, // Náhodné zpoždění pro každý kruh
    }))

    setCircles(newCircles)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {circles.map((circle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-gradient-to-r from-blue-200 to-blue-300 opacity-[0.03]"
          style={{
            left: circle.x,
            top: circle.y,
            width: circle.size,
            height: circle.size,
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: circle.delay,
          }}
        />
      ))}
    </div>
  )
}
