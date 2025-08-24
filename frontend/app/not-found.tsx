import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A192F]">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0A192F] via-[#0A192F] to-[#172A45]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-20%] left-1/2 transform -translate-x-1/2 w-[200%] h-[80%] bg-gradient-radial from-sky-400/15 via-transparent to-transparent blur-[100px] opacity-70 pointer-events-none"
        aria-hidden="true"
      />

      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]"
        aria-hidden="true"
      />
      
      <div 
        className="absolute inset-0 flex items-center justify-center text-white/5 pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[30rem] font-bold select-none">404</span>
      </div>

      <div className="relative z-10 text-center space-y-6">
        <h1 className="text-5xl font-semibold text-white tracking-tight">
          Page not found
        </h1>
        <p className="text-slate-300 text-lg">
          We can't find the page that you're looking for.<br />
          Probably the link is broken
        </p>
        <Button asChild variant="outline" size="lg" className="bg-white text-slate-800 hover:bg-slate-700">
          <Link href="/">
            Take me home
          </Link>
        </Button>
      </div>
    </div>
  )
}
