import { LineChart, Target, Users } from "lucide-react"

/**
 * "Why Quibly" — three differentiator cards (FOLD-01).
 * Single-column on mobile, 3-column at md: and up (D-13).
 *
 * Locked decisions:
 *   - Labels (D-13): "Strategy-first", "AI advisory board", "Metrics-driven loop" — verbatim
 *   - Icons (D-14): Target / Users / LineChart from lucide-react
 *   - Stroke 1.75px (design-system §1 Sidebar Icons convention)
 *   - Icon color: text-primary (one of only TWO inline-text/icon uses of teal on the page;
 *     the other is the footer wordmark)
 *   - Container: max-w-6xl mx-auto px-6 md:px-8 (D-17, NOT max-w-7xl)
 *
 * Descriptions are draft per D-28 — founder edits in PR.
 */
const DIFFERENTIATORS = [
  {
    icon: Target,
    label: "Strategy-first",
    description:
      "90-day plans before posts. Strategy drives execution; you stop guessing what to publish.",
  },
  {
    icon: Users,
    label: "AI advisory board",
    description:
      "Five AI specialists weigh in on every move — like having a marketing team in your pocket.",
  },
  {
    icon: LineChart,
    label: "Metrics-driven loop",
    description:
      "Real platform metrics flow back into the strategy so the next 90 days beat the last.",
  },
] as const

export function WhyQuibly() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <h2 className="mb-12 text-center font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
          Why Quibly
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {DIFFERENTIATORS.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-4 text-center"
            >
              <Icon
                className="text-primary"
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p className="font-heading text-lg font-semibold text-foreground">
                {label}
              </p>
              <p className="font-sans text-base text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
