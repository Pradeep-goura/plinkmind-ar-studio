import { Link } from 'react-router-dom'
import type { OnboardingStep } from './onboardingSteps'

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((step) => step.done).length
  if (doneCount === steps.length) return null

  return (
    <section aria-labelledby="start-heading" className="rounded-card bg-brand-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="start-heading" className="text-lg font-semibold">Getting started</h2>
        <p className="text-sm">{doneCount} of {steps.length} done</p>
      </div>
      <progress value={doneCount} max={steps.length} aria-label="Getting started progress" className="mt-2 w-full" />
      <ol className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true">{step.done ? '✓' : '○'}</span>
            <span className={step.done ? 'text-neutral-600 line-through' : 'font-medium'}>
              {step.to && !step.done ? (
                <Link to={step.to} className="underline">{step.label}</Link>
              ) : (
                step.label
              )}
            </span>
            <span className="sr-only">{step.done ? '(done)' : '(not done yet)'}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}