"use client";

import React from "react";
import SignUp from "./signup";
import Social from "./social";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function Register() {
  const queryString =
    typeof window !== "undefined" ? window?.location.search : "";
  const urlParams = new URLSearchParams(queryString);

  const next = urlParams.get("next");
  const verify = urlParams.get("verify");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const appIcon = process.env.NEXT_PUBLIC_APP_ICON!;

  return (
    <div className="flex min-h-[550px] w-[min(100%,24rem)] sm:w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-zinc-900 flex-col lg:flex-row">
      {/* Left Panel - Decorative */}
      <div className="lg:w-1/2 bg-gradient-to-br from-indigo-600 to-violet-500 p-4 sm:p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="relative z-10 space-y-4 lg:space-y-6 text-center lg:text-left">
          <Image
            src={appIcon}
            alt={appName}
            width={60}
            height={60}
            className="rounded-2xl shadow-xl ring-2 ring-white/20 transition-transform hover:scale-105 mx-auto lg:mx-0"
          />
          <h2 className="text-2xl lg:text-3xl font-bold text-white">{appName}</h2>
          <p className="text-indigo-100 max-w-sm mx-auto lg:mx-0 text-sm lg:text-base">
            Join our community and experience the next generation of web applications.
          </p>
        </div>
        <div className="relative z-10 hidden lg:block">
          <p className="text-indigo-100 text-sm">
            Powered by Next.js, Supabase, and modern web technologies
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-12">
        <div className="max-w-sm mx-auto space-y-6 lg:space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
              Create Account
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Welcome! Please fill in the details to get started.
            </p>
          </div>

          <Social redirectTo={next || "/"} />

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent"></div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">or</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent"></div>
          </div>

          <SignUp redirectTo={next || "/"} />
        </div>
      </div>
    </div>
  );
}
