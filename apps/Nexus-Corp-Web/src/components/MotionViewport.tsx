import { animate } from "framer-motion"
import { useEffect } from "react"

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function prepareElement(element: HTMLElement, distance: number) {
  element.style.opacity = "1"
  element.style.transform = `translate3d(0, ${Math.min(distance, 12)}px, 0)`
  element.style.willChange = "opacity, transform"
}

function revealElement(element: HTMLElement) {
  const controls = animate(
    element,
    { opacity: 1, transform: "translate3d(0, 0px, 0)" },
    { duration: 0.76, ease: EASE }
  )

  controls.then(() => {
    element.style.willChange = "auto"
  })
}

export default function MotionViewport() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    if (reduceMotion.matches) {
      return
    }

    const standalone = Array.from(
      document.querySelectorAll<HTMLElement>('[data-motion="reveal"]')
    )
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>("[data-motion-group]")
    )
    const timers: number[] = []
    const revealed = new WeakSet<Element>()

    standalone.forEach((element) => {
      prepareElement(element, Number(element.dataset.motionY ?? "26"))
    })

    groups.forEach((group) => {
      group
        .querySelectorAll<HTMLElement>("[data-motion-item]")
        .forEach((item) => {
          prepareElement(item, Number(item.dataset.motionY ?? "22"))
        })
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || revealed.has(entry.target)) {
            return
          }

          revealed.add(entry.target)
          observer.unobserve(entry.target)

          if (
            entry.target instanceof HTMLElement &&
            entry.target.dataset.motionGroup !== undefined
          ) {
            const items = Array.from(
              entry.target.querySelectorAll<HTMLElement>("[data-motion-item]")
            )

            items.forEach((item, index) => {
              timers.push(
                window.setTimeout(() => revealElement(item), index * 85)
              )
            })
            return
          }

          if (entry.target instanceof HTMLElement) {
            revealElement(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.14 }
    )

    standalone.forEach((element) => observer.observe(element))
    groups.forEach((group) => observer.observe(group))

    return () => {
      observer.disconnect()
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  return null
}
