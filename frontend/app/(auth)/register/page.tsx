import Register from "@/components/supaauth/register";
import React from "react";

function page() {
  return (
    <main className="min-h-screen w-full grid place-items-center p-4 sm:p-8 bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="w-full max-w-6xl mx-auto">
        <Register />
      </div>
    </main>
  );
}

export default page;
