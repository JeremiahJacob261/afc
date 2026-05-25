import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'

type Props = {
  images: any[] // StaticImageData[] or string[]
  interval?: number
}

export default function AnimatedCarousel({ images, interval = 4000 }: Props) {
  const length = images?.length || 0
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAutoplay = useCallback(() => {
    if (!autoplayRef.current) return
    clearInterval(autoplayRef.current)
    autoplayRef.current = null
  }, [])

  const startAutoplay = useCallback(() => {
    if (!emblaApi || length <= 1) return
    stopAutoplay()
    autoplayRef.current = setInterval(() => {
      emblaApi.scrollNext()
    }, interval)
  }, [emblaApi, interval, length, stopAutoplay])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    startAutoplay()

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      stopAutoplay()
    }
  }, [emblaApi, onSelect, startAutoplay, stopAutoplay])

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
    startAutoplay()
  }, [emblaApi, startAutoplay])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
    startAutoplay()
  }, [emblaApi, startAutoplay])

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index)
    startAutoplay()
  }, [emblaApi, startAutoplay])

  if (!length) return null

  return (
    <div style={{ width: '100%', maxWidth: 350, margin: '0 auto' }}>
      <div
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
        onFocus={stopAutoplay}
        onBlur={startAutoplay}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, width: '100%', aspectRatio: '16 / 9', background: '#10284D' }}
      >
        <div style={{ display: 'flex', height: '100%', touchAction: 'pan-y pinch-zoom' }}>
          {images.map((image, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${length}`}
              style={{ position: 'relative', flex: '0 0 100%', minWidth: 0 }}
            >
              <Image
                src={image}
                alt={`slide-${index + 1}`}
                fill
                sizes="(max-width: 450px) calc(100vw - 24px), 350px"
                priority={index === 0}
                unoptimized
                loading={index === 0 ? 'eager' : 'lazy'}
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>

        <button
          aria-label="Previous slide"
          onClick={scrollPrev}
          style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', padding: 8, borderRadius: 6 }}
        >‹</button>
        <button
          aria-label="Next slide"
          onClick={scrollNext}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', padding: 8, borderRadius: 6 }}
        >›</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
        {scrollSnaps.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === selectedIndex}
            style={{ width: 10, height: 10, borderRadius: 10, border: 'none', background: i === selectedIndex ? '#1BB6FF' : '#ccc' }}
          />
        ))}
      </div>
    </div>
  )
}
