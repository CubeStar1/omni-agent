"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';

interface GenericToolDisplayProps {
  args: any;
  result: any;
}

export const GenericToolDisplay: React.FC<GenericToolDisplayProps> = ({ args, result }) => {
  const argsString = JSON.stringify(args, null, 2);
  const resultString = result ? JSON.stringify(result, null, 2) : 'No response content';

  return (
    <div className="space-y-4 text-sm">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-2">
          <CardTitle className="text-base">Request</CardTitle>
          <CopyButton value={argsString} />
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-md bg-background overflow-x-auto"><code>{argsString}</code></pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-2">
          <CardTitle className="text-base">Response</CardTitle>
          <CopyButton value={resultString} />
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-md bg-background overflow-x-auto"><code>{resultString}</code></pre>
        </CardContent>
      </Card>
    </div>
  );
};
