// Adaptado de "Parallax Scrolling" (Osmo, vía 21st.dev). Lenis vive en useLenis para no duplicarlo por instancia.
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  title: string
  image: string
  imageAlt?: string
}

const layers = [
  { layer: '1', yPercent: 70 },
  { layer: '2', yPercent: 55 },
  { layer: '3', yPercent: 40 },
  { layer: '4', yPercent: 10 },
]

export function ParallaxComponent({ title, image, imageAlt = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trigger = ref.current?.querySelector('[data-parallax-layers]')
    if (!trigger || matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger, start: '0% 0%', end: '100% 0%', scrub: 0 },
      })
      layers.forEach(({ layer, yPercent }, idx) => {
        tl.to(trigger.querySelectorAll(`[data-parallax-layer="${layer}"]`), { yPercent, ease: 'none' }, idx === 0 ? undefined : '<')
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div className="parallax" ref={ref}>
      <div className="parallax__header">
        <div className="parallax__visuals">
          <div data-parallax-layers className="parallax__layers">
            <img src={image} alt={imageAlt} loading="lazy" decoding="async" data-parallax-layer="1" className="parallax__layer-img" />
            <svg data-parallax-layer="2" className="parallax__layer-img parallax__ridge" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
              <path d="M0 640 L140 560 L260 610 L420 470 L560 560 L700 500 L820 580 L980 430 L1120 540 L1260 480 L1400 570 L1600 500 V900 H0 Z" />
            </svg>
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h2 className="parallax__title">{title}</h2>
            </div>
            <svg data-parallax-layer="4" className="parallax__layer-img parallax__ridge parallax__ridge--front" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
              <path d="M0 760 L180 690 L320 740 L520 640 L700 730 L860 680 L1040 760 L1220 660 L1400 730 L1600 680 V900 H0 Z" />
            </svg>
          </div>
          <div className="parallax__fade" />
        </div>
      </div>
    </div>
  )
}
