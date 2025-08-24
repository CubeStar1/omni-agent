import React from "react";
import Signin from "@/components/supaauth/signin";

const page = () => {
  return (
    <main className="min-h-screen w-full grid place-items-center p-4 sm:p-8 bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="w-full max-w-6xl mx-auto">
        <Signin />
      </div>
    </main>
  );
};

export default page;
