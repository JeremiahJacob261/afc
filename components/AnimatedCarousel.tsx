import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Props = {
  images: any[] // StaticImageData[] or string[]
  interval?: number
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.95 }),
}

export default function AnimatedCarousel({ images, interval = 4000 }: Props) {
  const [[page, direction], setPage] = useState([0, 0])
  const timeoutRef = useRef<any>(null)
  const length = images?.length || 0
  const currentImage = images?.[page]
  const currentSrc = typeof currentImage === 'string' ? currentImage : currentImage?.src

  useEffect(() => {
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, images])

  const start = () => {
    stop()
    timeoutRef.current = setTimeout(() => paginate(1), interval)
  }
  const stop = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  const paginate = (newDirection: number) => {
    setPage(([p]) => {
      const next = (p + newDirection + length) % length
      return [next, newDirection]
    })
  }

  const handleDot = (i: number) => {
    const dir = i > page ? 1 : -1
    setPage([i, dir])
  }

  if (!length || !currentSrc) return null

  return (
    <div style={{ width: '100%', maxWidth: 350 }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ position: 'relative' }}
            onMouseEnter={stop}
            onMouseLeave={start}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              const offset = info.offset.x
              if (offset < -50) paginate(1)
              else if (offset > 50) paginate(-1)
            }}
          >
            <img
              src={currentSrc}
              alt={`slide-${page}`}
              width={350}
              height={195}
              loading={page === 0 ? 'eager' : 'lazy'}
              style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
            />
          </motion.div>
        </AnimatePresence>

        <button
          aria-label="prev"
          onClick={() => paginate(-1)}
          style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', padding: 8, borderRadius: 6 }}
        >‹</button>
        <button
          aria-label="next"
          onClick={() => paginate(1)}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', padding: 8, borderRadius: 6 }}
        >›</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDot(i)}
            aria-label={`go-to-${i}`}
            style={{ width: 10, height: 10, borderRadius: 10, border: 'none', background: i === page ? '#1BB6FF' : '#ccc' }}
          />
        ))}
      </div>
    </div>
  )
}
