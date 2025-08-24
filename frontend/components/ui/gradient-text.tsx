export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-500/80 bg-clip-text text-center text-4xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
        {children}
    </span>
  )
}
