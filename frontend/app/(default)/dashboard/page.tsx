
'use client';

import { useState } from 'react';
import { RequestSelector } from '@/components/dashboard/request-selector';
import { ComparisonView } from '@/components/dashboard/comparison-view';
import { DashboardErrorBoundary } from '@/components/dashboard/error-boundary';

export default function Dashboard() {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  return (
    <DashboardErrorBoundary>
      <div className=" bg-background">
        <div className="p-2 lg:p-4">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              LLM QA Response Dashboard
            </h1>
            <p className="text-muted-foreground">
              Compare and analyze responses from your LLM question-answering system
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4">
            {/* Left Panel - Request Selector */}
            <div className="lg:col-span-4">
              <RequestSelector
                selectedRequests={selectedRequests}
                onSelectionChange={setSelectedRequests}
              />
            </div>
            
            {/* Right Panel - Comparison View */}
            <div className="lg:col-span-8">
              <ComparisonView selectedRequests={selectedRequests} />
            </div>
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
