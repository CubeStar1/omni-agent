"use client"

import { ArrowRight, ArrowRightIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { BlurFade } from "@/components/magicui/blur-fade"
import { BorderBeam } from "@/components/magicui/border-beam"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text"
import { cn } from "@/lib/utils"

const auroraColors = ["#0070F3", "#38bdf8", "#2dd4bf", "#7928CA", "#FF0080", "#a855f7"]

export function Hero() {
  return (
    <section className="py-20 sm:py-24 lg:py-32">
      <div className="group relative mx-auto flex justify-center">
        <BlurFade delay={0.25} inView>
          <Link
            href="https://sdk.vercel.ai/docs"
            target="_blank"
            className="group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
              <span>✨ Vercel AI SDK Integration</span>
              <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </Link>
        </BlurFade>
      </div>

      <div className="mt-10 text-center">
        <BlurFade delay={0.5} inView>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Vercel AI SDK{" "}
            <span className="bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              Template
            </span>{" "}
            for Next.js
          </h1>
        </BlurFade>
        <BlurFade delay={0.75} inView>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:mt-8">
            Build, and scale AI-powered applications with this template. Integrates
            Vercel AI SDK for streaming, UI components, and React Server
            Components.
          </p>
        </BlurFade>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 sm:mt-10">
        <BlurFade delay={1.0} inView>
          <Link href="/chat">
            <ShimmerButton
              className="flex items-center gap-2 px-6 py-3 text-base sm:text-lg"
              background="linear-gradient(to right, #0070F3, #38bdf8)"
            >
              <span className="whitespace-pre-wrap text-center font-medium leading-none tracking-tight text-white">
                Go to Chat
              </span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 sm:w-5 sm:h-5" />
            </ShimmerButton>
          </Link>
        </BlurFade>
        <BlurFade delay={1.25} inView>
          <Link href="https://github.com/vercel/ai-sdk" target="_blank">
            <div>
              <ShimmerButton
                className="flex items-center gap-2 px-6 py-3 text-base sm:text-lg"
                background="linear-gradient(to right, #334155, #0f172a)"
              >
                <span className="whitespace-pre-wrap text-center font-medium leading-none tracking-tight text-white">
                  Explore Docs
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 sm:w-5 sm:h-5" />
              </ShimmerButton>
            </div>
          </Link>
        </BlurFade>
      </div>

      <div className="relative mx-auto mt-16 sm:mt-20 lg:mt-24">
        <BlurFade delay={1.5} inView>
          <div className="relative rounded-2xl bg-gradient-to-b from-muted/50 to-muted p-2 ring-1 ring-foreground/10 backdrop-blur-3xl dark:from-muted/30 dark:to-background/80">
            <Image
              src="https://raw.githubusercontent.com/vercel/ai-sdk/main/packages/core/static/og-image.png"
              alt="Vercel AI SDK"
              width={1200}
              height={630}
              quality={100}
              className="rounded-xl shadow-2xl ring-1 ring-foreground/10 transition-all duration-300"
            />
            <BorderBeam size={250} duration={12} delay={9} />
          </div>
        </BlurFade>
      </div>
    </section>
  )
}