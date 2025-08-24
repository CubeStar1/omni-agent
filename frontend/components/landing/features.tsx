"use client"

import { motion } from "framer-motion"
import { Bot, Component, GitBranch, MessagesSquare, Mic, Server, Settings2, Sparkles, Zap } from "lucide-react"
import SectionBadge from "@/components/ui/section-badge"
import { cn } from "@/lib/utils"

const features = [
  {
    title: "AI SDK Integration",
    info: "Seamlessly integrate with the Vercel AI SDK for powerful, scalable AI applications.",
    icon: Zap,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    title: "Streaming & RSC Support",
    info: "Leverage React Server Components for efficient data fetching and UI streaming.",
    icon: Server,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Ready-to-Use Chat UI",
    info: "A pre-built, customizable chat interface to get you started in minutes.",
    icon: MessagesSquare,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Extensible & Customizable",
    info: "Easily modify and extend the template to fit your unique application needs.",
    icon: Settings2,
    gradient: "from-purple-500 to-violet-500",
  },
  {
    title: "Voice-Enabled Interactions",
    info: "Integrate voice commands and speech-to-text for a hands-free user experience.",
    icon: Mic,
    gradient: "from-red-500 to-rose-500",
  },
  {
    title: "Component-Based Architecture",
    info: "Built with Shadcn/UI for a modern, component-driven development workflow.",
    icon: Component,
    gradient: "from-indigo-500 to-purple-500",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function Features() {
  return (
    <section className="py-20 sm:py-24 lg:py-32">
      <div className="text-center">
        <SectionBadge title="Features" />
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Why Use This Vercel AI SDK Template?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Discover the powerful capabilities that make this template the perfect starting point for your next AI project.
        </motion.p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mt-16 grid grid-cols-1 gap-6 sm:mt-20 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={item}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-gradient-to-b from-muted/50 to-muted p-8",
                "ring-1 ring-foreground/10 backdrop-blur-xl transition-all duration-300 hover:ring-foreground/20",
                "dark:from-muted/30 dark:to-background/80"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
                  feature.gradient,
                  "ring-1 ring-foreground/10"
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
              </div>
              <p className="mt-4 text-muted-foreground">
                {feature.info}
              </p>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r",
                feature.gradient,
                "opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              )} />
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  )
} 