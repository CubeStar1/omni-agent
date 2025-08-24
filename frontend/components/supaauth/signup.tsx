"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { RiArrowRightSFill, RiArrowDropLeftFill } from "react-icons/ri";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { SiMinutemailer } from "react-icons/si";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { verifyOtp } from "@/actions/auth";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
const FormSchema = z
  .object({
    email: z.string().email({
      message: "Invalid Email Address",
    }),
    password: z.string().min(6, {
      message: "Password is too short",
    }),
    "confirm-pass": z.string().min(6, {
      message: "Password is too short",
    }),
  })
  .refine(
    (data) => {
      if (data["confirm-pass"] !== data.password) {
        console.log("running");
        return false;
      } else {
        return true;
      }
    },
    {
      message: "Password does't match",
      path: ["confirm-pass"],
    },
  );
export default function SignUp({ redirectTo }: { redirectTo: string }) {
  const queryString =
    typeof window !== "undefined" ? window.location.search : "";
  const urlParams = new URLSearchParams(queryString);
  const verify = urlParams.get("verify");
  const existEmail = urlParams.get("email");
  const [passwordReveal, setPasswordReveal] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(verify === "true");
  const [verifyStatus, setVerifyStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isSendAgain, startSendAgain] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      "confirm-pass": "",
    },
  });
  const postEmail = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    };
    // Send the POST request
    const res = await fetch("/api/auth/signup", requestOptions);
    const json = await res.json();
    return json;
  };
  const sendVerifyEmail = async (data: z.infer<typeof FormSchema>) => {
    const json = await postEmail({
      email: data.email,
      password: data.password,
    });
    if (!json.error) {
      router.replace(
        (pathname || "/") + "?verify=true&email=" + form.getValues("email"),
      );
      setIsConfirmed(true);
    } else {
      if (json.error.code) {
        toast.error(json.error.code);
      } else if (json.error.message) {
        toast.error(json.error.message);
      }
    }
  };
  const inputOptClass = cn({
    " border-green-500": verifyStatus === "success",
    " border-red-500": verifyStatus === "failed",
  });
  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!isPending) {
      startTransition(async () => {
        await sendVerifyEmail(data);
      });
    }
  }
  return (
    <div className="relative w-full overflow-hidden">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            `space-y-4 sm:space-y-5 w-full transform transition-all duration-500 ease-in-out`,
            {
              "-translate-x-full": isConfirmed,
            },
          )}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-10 sm:h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                    placeholder="example@gmail.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Input
                      className="h-10 sm:h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 pr-10"
                      type={passwordReveal ? "text" : "password"}
                      {...field}
                    />
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      onClick={() => setPasswordReveal(!passwordReveal)}
                    >
                      {passwordReveal ? (
                        <FaRegEye className="w-4 h-4" />
                      ) : (
                        <FaRegEyeSlash className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500 text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm-pass"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Input
                      className="h-10 sm:h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 pr-10"
                      type={passwordReveal ? "text" : "password"}
                      {...field}
                    />
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      onClick={() => setPasswordReveal(!passwordReveal)}
                    >
                      {passwordReveal ? (
                        <FaRegEye className="w-4 h-4" />
                      ) : (
                        <FaRegEyeSlash className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500 text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <AiOutlineLoading3Quarters
              className={cn("w-4 h-4", !isPending ? "hidden" : "animate-spin")}
            />
            Continue
            <RiArrowRightSFill className="w-5 h-5" />
          </Button>
          <div className="text-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            <h1>
              Already have account?{" "}
              <Link
                href={redirectTo ? `/signin?next=${redirectTo}` : "/signin"}
                className="text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
              >
                Sign in
              </Link>
            </h1>
          </div>
        </form>
      </Form>

      {/* Verify email section */}
      <div
        className={cn(
          `w-full absolute top-0 left-0 transform transition-all duration-500 ease-in-out`,
          isConfirmed ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex min-h-[400px] items-center justify-center flex-col space-y-6 p-4 sm:p-8">
          <div className="bg-indigo-500/10 dark:bg-indigo-500/5 p-4 rounded-full">
            <SiMinutemailer className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
              Verify Email
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
              A verification code has been sent to{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {verify === "true" ? existEmail : form.getValues("email")}
              </span>
            </p>
          </div>

          <InputOTP
            pattern={REGEXP_ONLY_DIGITS}
            id="input-otp"
            maxLength={6}
            onChange={async (value) => {
              if (value.length === 6) {
                document.getElementById("input-otp")?.blur();
                const res = await verifyOtp({
                  email: form.getValues("email"),
                  otp: value,
                  type: "email",
                });
                const { error } = JSON.parse(res);
                if (error) {
                  setVerifyStatus("failed");
                } else {
                  setVerifyStatus("success");
                  router.push(redirectTo);
                }
              }
            }}
            className="gap-1 sm:gap-2"
          >
            <InputOTPGroup>
              <InputOTPSlot
                index={0}
                className={cn(
                  "rounded-xl h-10 w-10 sm:h-12 sm:w-12 border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-300 text-sm sm:text-base",
                  inputOptClass,
                )}
              />
              <InputOTPSlot
                index={1}
                className={cn(
                  "rounded-xl h-10 w-10 sm:h-12 sm:w-12 border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-300 text-sm sm:text-base",
                  inputOptClass,
                )}
              />
              <InputOTPSlot
                index={2}
                className={cn(
                  "rounded-xl h-10 w-10 sm:h-12 sm:w-12 border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-300 text-sm sm:text-base",
                  inputOptClass,
                )}
              />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot
                index={3}
                className={cn(
                  "rounded-xl h-10 w-10 sm:h-12 sm:w-12 border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-300 text-sm sm:text-base",
                  inputOptClass,
                )}
              />
              <InputOTPSlot
                index={4}
                className={cn(
                  "rounded-xl h-10 w-10 sm:h-12 sm:w-12 border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-300 text-sm sm:text-base",
                  inputOptClass,
                )}
              />
              <InputOTPSlot
                index={5}
                className={cn(
                  "rounded-xl h-10 w-10 sm:h-12 sm:w-12 border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-300 text-sm sm:text-base",
                  inputOptClass,
                )}
              />
            </InputOTPGroup>
          </InputOTP>

          <div className="text-xs sm:text-sm flex gap-2 items-center text-zinc-600 dark:text-zinc-400">
            <p>Didn't work?</p>
            <span
              className="text-indigo-500 hover:text-indigo-600 cursor-pointer hover:underline transition-colors flex items-center gap-2"
              onClick={async () => {
                if (!isSendAgain) {
                  startSendAgain(async () => {
                    if (!form.getValues("password")) {
                      const json = await postEmail({
                        email: form.getValues("email"),
                        password: form.getValues("password"),
                      });
                      if (json.error) {
                        toast.error("Failed to resend email");
                      } else {
                        toast.success("Please check your email.");
                      }
                    } else {
                      router.replace(pathname || "/register");
                      form.setValue("email", existEmail || "");
                      form.setValue("password", "");
                      setIsConfirmed(false);
                    }
                  });
                }
              }}
            >
              <AiOutlineLoading3Quarters
                className={cn("w-4 h-4", !isSendAgain ? "hidden" : "animate-spin")}
              />
              Send me another code
            </span>
          </div>

          <Button
            type="button"
            className="w-full h-10 sm:h-11 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            onClick={() => setIsConfirmed(false)}
          >
            <RiArrowDropLeftFill className="w-5 h-5 sm:w-6 sm:h-6" />
            Change Email
          </Button>
        </div>
      </div>
    </div>
  );
}
