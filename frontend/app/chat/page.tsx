import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateUUID } from "./lib/utils/generate-uuid";
export default async function NewChatPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/signin");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      id: generateUUID(),
      title: "New Chat",
      user_id: user.id,
    })
    .select()
    .single();
  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  return redirect(`/chat/${conversation.id}`);
}
