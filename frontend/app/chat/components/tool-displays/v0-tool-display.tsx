import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

interface V0ToolDisplayProps {
  data: any;
}


export const V0ToolDisplay: React.FC<V0ToolDisplayProps> = ({ data }) => {
  let demoUrl: string | undefined = undefined;
  if (data?.content && Array.isArray(data.content)) {
    try {
      const textObj = data.content.find((c: any) => c.type === "text");
      if (textObj) {
        const parsed = JSON.parse(textObj.text);
        demoUrl =
          parsed?.messageData?.latestVersion?.demoUrl ||
          parsed?.demo ||
          parsed?.messageData?.demoUrl;
      }
    } catch (e) {
    }
  }
  if (!demoUrl && data.demo) demoUrl = data.demo;

  if (!demoUrl && data?.content) {
    const str = JSON.stringify(data.content);
    const match = str.match(/https:\/\/demo-[a-zA-Z0-9\-]+\.vusercontent\.net/);
    if (match) demoUrl = match[0];
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-4">
      <div className="font-semibold text-lg text-primary flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="inline-block"><rect width="24" height="24" rx="6" fill="#0A0A23"/><path d="M7.5 8.5C7.5 7.67157 8.17157 7 9 7H15C15.8284 7 16.5 7.67157 16.5 8.5V15.5C16.5 16.3284 15.8284 17 15 17H9C8.17157 17 7.5 16.3284 7.5 15.5V8.5Z" fill="#fff"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="#0A0A23"/></svg>
        Website Preview
      </div>
      {demoUrl ? (
        <>
          <div className="w-full aspect-video rounded-md overflow-hidden border bg-muted">
            <iframe
              src={demoUrl}
              title="v0 Website Demo"
              className="w-full h-full min-h-[350px] border-none rounded-md"
              allow="clipboard-write; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <div className="flex justify-end mt-2">
            <Dialog>
              <DialogTrigger asChild>
                <button className="px-3 py-1 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition">Expand</button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl w-full h-[80vh] flex flex-col items-center justify-center">
                <div className="w-full h-full flex flex-col">
                  <div className="mb-2 font-semibold text-lg text-primary">Preview</div>
                  <iframe
                    src={demoUrl}
                    title="v0 Website Demo Large"
                    className="w-full h-full min-h-[500px] border-none rounded-md bg-muted"
                    allow="clipboard-write; fullscreen"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground italic">No live preview available.</div>
      )}
      <div className="text-xs text-muted-foreground break-all">
        {demoUrl && (
          <>
            <span className="font-medium">Demo URL:</span> <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">{demoUrl}</a>
          </>
        )}
      </div>
    </div>
  );
};

export default V0ToolDisplay;
