import { cn } from '../../lib/utils'
import type { LegalBlock, LegalSection } from '../../content/legal/types'

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (block.type === 'paragraph') {
    return <p className="text-[15px] leading-7 text-gray-700">{block.text}</p>
  }

  if (block.type === 'list') {
    return (
      <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-gray-700">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 sm:px-5',
        block.variant === 'warning'
          ? 'border-amber-200 bg-amber-50'
          : 'border-brand-200 bg-brand-50',
      )}
    >
      {block.title && (
        <p
          className={cn(
            'mb-2 text-sm font-semibold',
            block.variant === 'warning' ? 'text-amber-900' : 'text-brand-900',
          )}
        >
          {block.title}
        </p>
      )}
      <p
        className={cn(
          'text-sm leading-6',
          block.variant === 'warning' ? 'text-amber-800' : 'text-brand-800',
        )}
      >
        {block.text}
      </p>
    </div>
  )
}

function LegalSectionView({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
        {section.title}
      </h2>
      <div className="mt-4 space-y-4">
        {section.blocks.map((block, index) => (
          <LegalBlockView key={`${section.id}-${index}`} block={block} />
        ))}
      </div>
    </section>
  )
}

interface LegalDocumentViewProps {
  title: string
  subtitle: string
  lastUpdated: string
  lastUpdatedLabel: string
  sections: LegalSection[]
}

export function LegalDocumentView({
  title,
  subtitle,
  lastUpdated,
  lastUpdatedLabel,
  sections,
}: LegalDocumentViewProps) {
  return (
    <article>
      <header className="border-b border-gray-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Genza · Pravni dokumenti
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">{subtitle}</p>
        <p className="mt-4 text-sm text-gray-500">
          {lastUpdatedLabel}: {lastUpdated}
        </p>
      </header>

      {sections.length > 1 && (
        <nav
          aria-label="Sadržaj dokumenta"
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Sadržaj
          </p>
          <ol className="mt-3 space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <LegalSectionView key={section.id} section={section} />
        ))}
      </div>
    </article>
  )
}
