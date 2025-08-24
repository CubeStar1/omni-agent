"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Message } from "ai";
import { memo } from "react";
import { saveMessages } from "../actions";
interface SuggestedActionsProps {
  chatId: string;
  append: (message: Message) => Promise<string | null | undefined>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}
function PureSuggestedActions({
  chatId,
  append,
  handleSubmit,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: "Round 6 Code",
      label: "Find smallest almost-equal substring index (LLM-only)",
      action:
        `Query: You are given two strings s and pattern.\nA string x is called almost equal to y if you can change at most one character in x to make it identical to y.\nReturn the smallest starting index of a substring in s that is almost equal to pattern. If no such index exists, return -1.\n\nWrite a code to solve the problem. You should generate the code through LLM and run it and get the answer as response and return this answer as the API response. Then, also push the code in a folder names ROUND_6 to the repo STRICTLY provided by the HACKRX TEAM.\n\nTHIS ENTIRE CHALLENGE TO BE DONE BY LLM ONLY. NO HUMAN INTERVENTION ALLOWED. THIS INCLUDES GENERATION OF CODE, RUNNING IT AND PUSHING TO GITHUB REPO, TO THE SAME REPO PROVIDED BY THE HACKRX TEAM.\n\nQuestions:\n1. The value of s is abcdefg and pattern is bcdffg\n2. The value of s is ababbababa and pattern is bacaba`,
    },
    {
      title: "Round 7 Github",
      label: "Analyze GitHub repo for mmkv-shared version (LLM-only)",
      action:
        `Query: You are given a github repository link. Analyse the repo and answer the question. THIS ENTIRE CHALLENGE TO BE DONE BY LLM ONLY. NO HUMAN INTERVENTION ALLOWED.\n\nQuestions:\n1. What is the version of mmkv-shared in this Repo? https://github.com/mrousavy/react-native-mmkv/blob/main/package/android/build.gradle`,
    },
    {
      title: "Round 7 Hidden",
      label: "Start challenge and extract ID & code (LLM-only)",
      action:
        `Query: Go to the website and start the challenge. Complete the challenge and return the answers for the following questions.\n\nQuestions:\n1. What is the challenge ID? (URL: https://register.hackrx.in/showdown/startChallenge/ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiMjlzUjNWNUlqb2lVa2xVUlZOSUlpd2lZMmhoYkd4bGJtZGxTVVFpT2lKb2FXUmtaVzRpTENKMWMyVnlTV1FpT2lKMWMyVnlYM0pwZEdWemFDSXNJbVZ0WVdsc0lqb2ljbWwwWlhOb1FHSmhhbUZxWm1sdWMyVnlkbWhsWVd4MGFDNXBiaUlzSW5KdmJHVWlPaUpqYjI5c1gyZDFlU0lzSW1saGRDSTZNVGMxTlRnMk1USTFPQ3dpWlhod0lqb3hOelUxT1RRM05qVTRmUS4zWjRqZWFRN0dOSWd0ck1qY2MxbldCX2JiNkZnY2tvWTF5QjFOX3hVZV9F)\n2. What is the completion code? (URL: https://register.hackrx.in/showdown/startChallenge/ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiMjlzUjNWNUlqb2lVa2xVUlZOSUlpd2lZMmhoYkd4bGJtZGxTVVFpT2lKb2FXUmtaVzRpTENKMWMyVnlTV1FpT2lKMWMyVnlYM0pwZEdWemFDSXNJbVZ0WVdsc0lqb2ljbWwwWlhOb1FHSmhhbUZxWm1sdWMyVnlkbWhsWVd4MGFDNXBiaUlzSW5KdmJHVWlPaUpqYjI5c1gyZDFlU0lzSW1saGRDSTZNVGMxTlRnMk1USTFPQ3dpWlhod0lqb3hOelUxT1RRM05qVTRmUS4zWjRqZWFRN0dOSWd0ck1qY2MxbldCX2JiNkZnY2tvWTF5QjFOX3hVZV9F)`,
    },
    {
      title: "Round 7 Sequence",
      label: "Start challenge and extract sequence info (LLM-only)",
      action:
        `Query: Go to the website and start the challenge. Complete the challenge and return the answers for the following questions.\n\nQuestions:\n1. What is the challenge ID? (URL: https://register.hackrx.in/showdown/startChallenge/$)\n2. What is the completion code? (URL: https://register.hackrx.in/showdown/v2/startChallenge/ZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LmV5SmphR0ZzYkdWdVoyVkpSQ0k2SW5ObGNYVmxibU5sSWl3aVpYaHdJam94TnpNMU5qZzVOakF3TENKcFlYUWlPakUzTXpJd09UYzJNREFzSW1ScFptWnBZM1ZzZEhraU9pSnRaV1JwZFcwaUxDSjBhVzFsYzNSaGJYQWlPakUzTXpJd09UYzJNREF3TURCOS5aR1Z0YnkxemFXZHVZWFIxY21VdE1UYzFOVGt3TkRrME5qY3dOZw==)`,
    },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full pb-2">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 20,
          }}
          transition={{
            delay: 0.05 * index,
          }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              const userMessage: Message = {
                id: crypto.randomUUID(),
                role: 'user',
                content: suggestedAction.action,
              };
              await saveMessages([userMessage], chatId);
              await append(userMessage);
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm gap-1 sm:flex-col w-full h-auto justify-start items-start sm:items-stretch"
          >
            <span className="font-medium truncate">{suggestedAction.title}</span>
            <span className="text-muted-foreground truncate">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
export const SuggestedActions = memo(PureSuggestedActions, () => true);
