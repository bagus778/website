import Link from 'next/link'

interface DashLinkProps {
  href: string
  icon: string
  iconBg?: string
  title: string
  subtitle: string
  color?: string
}

export default function DashLink({ href, icon, iconBg = 'bg-slate-100', title, subtitle }: DashLinkProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} text-2xl`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900 transition group-hover:text-slate-700">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <svg
          className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}