"use client"

/**
 * Animaties met Motion (voorheen Framer Motion, https://motion.dev).
 *
 * Spelregels (zie ook .claude/skills/frontend-design):
 * - Spaarzaam: één opvallend moment per pagina (bv. de hero), de rest rustig.
 * - Alleen transform/opacity animeren (soepel, geen layout-shift).
 * - "Minder beweging" op het apparaat van de bezoeker wordt altijd gerespecteerd
 *   (MotionConfig reducedMotion="user").
 * - LazyMotion + `m.*`: alleen de animatiecode die we gebruiken komt in de bundle.
 *
 * Gebruik in server components is prima: deze componenten zijn zelf client components.
 *   <Reveal><h2>…</h2></Reveal>
 *   <Stagger className="grid grid-cols-3"> <StaggerItem>…</StaggerItem> … </Stagger>
 */

import {
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
  type HTMLMotionProps,
  type Variants,
} from "motion/react"

export { m } from "motion/react"

/** Gedeelde timing, zodat alle winkels hetzelfde aanvoelen. */
export const ease = [0.22, 1, 0.36, 1] as const
export const duration = { fast: 0.2, base: 0.45, slow: 0.8 }

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

type RevealProps = HTMLMotionProps<"div"> & {
  /** Afstand in px waarover het element omhoog schuift. */
  y?: number
  delay?: number
}

/** Fadet een blok in zodra het (één keer) in beeld komt. */
export function Reveal({ y = 16, delay = 0, children, ...rest }: RevealProps) {
  return (
    <m.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: duration.base, ease, delay }}
      {...rest}
    >
      {children}
    </m.div>
  )
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease } },
}

/** Laat kinderen (StaggerItem) kort na elkaar inkomen, bv. een productraster. */
export function Stagger({ children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      {...rest}
    >
      {children}
    </m.div>
  )
}

export function StaggerItem({ children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <m.div variants={staggerChild} {...rest}>
      {children}
    </m.div>
  )
}
