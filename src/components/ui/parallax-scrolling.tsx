// Adaptado de "Parallax Scrolling" (Osmo, vía 21st.dev). Lenis vive en useLenis para no duplicarlo por instancia.
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  title: string
  image: string
  imageSrcSet?: string
  imageAlt?: string
}

const layers = [
  { layer: '1', yPercent: 45 },
  { layer: '3', yPercent: 70 },
]

export function ParallaxComponent({ title, image, imageSrcSet, imageAlt = '' }: Props) {
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
            <img src={image} srcSet={imageSrcSet} sizes="100vw" alt={imageAlt} loading="lazy" decoding="async" data-parallax-layer="1" className="parallax__layer-img" />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h2 className="parallax__title">{title}</h2>
            </div>
          </div>
          <div className="parallax__fade" />
        </div>
      </div>
    </div>
  )
}
