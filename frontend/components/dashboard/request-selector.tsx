'use client';

import { useState, useEffect, useMemo } from 'react';
import { RequestSummary, getRequestSummaries } from '@/lib/queries/hackrx-requests';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

interface RequestSelectorProps {
  selectedRequests: string[];
  onSelectionChange: (requestIds: string[]) => void;
}

export function RequestSelector({ selectedRequests, onSelectionChange }: RequestSelectorProps) {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getRequestSummaries();
      setRequests(data);
    } catch (err) {
      setError('Failed to load requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group requests by document URL
  const groupedRequests = useMemo(() => {
    const groups: Record<string, RequestSummary[]> = {};
    requests.forEach(request => {
      if (!groups[request.document_url]) {
        groups[request.document_url] = [];
      }
      groups[request.document_url].push(request);
    });
    
    // Sort each group by timestamp (newest first)
    Object.keys(groups).forEach(url => {
      groups[url].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    
    return groups;
  }, [requests]);

  const handleRequestToggle = (requestId: string, groupUrl: string) => {
    const currentGroupSelections = selectedRequests.filter(id => 
      groupedRequests[groupUrl]?.some((req: RequestSummary) => req.id === id)
    );
    
    if (selectedRequests.includes(requestId)) {
      onSelectionChange(selectedRequests.filter(id => id !== requestId));
    } else if (currentGroupSelections.length < 2) {
      // Remove any selections from other groups and add this one
      const otherGroupSelections = selectedRequests.filter(id => 
        !groupedRequests[groupUrl]?.some((req: RequestSummary) => req.id === id)
      );
      onSelectionChange([...selectedRequests.filter(id => !otherGroupSelections.includes(id)), requestId]);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatProcessingTime = (time: number) => {
    return `${time.toFixed(2)}s`;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Loading Requests...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={loadRequests} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[calc(80vh)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select Requests to Compare
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select up to 2 requests from the same document to compare their responses
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[calc(80vh)]">
          <div className="px-6 pb-6">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedRequests).map(([documentUrl, groupRequests]) => {
                const urlParts = documentUrl.split('/');
                const fileName = urlParts[urlParts.length - 1] || documentUrl;
                const groupSelections = selectedRequests.filter(id => 
                  groupRequests.some((req: RequestSummary) => req.id === id)
                );
                
                return (
                  <AccordionItem key={documentUrl} value={documentUrl} className="border-b">
                    <AccordionTrigger className="text-left hover:no-underline py-3">
                      <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-medium text-sm truncate" title={fileName}>
                            {fileName}
                          </span>
                          {groupSelections.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {groupSelections.length} selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{groupRequests.length} request{groupRequests.length !== 1 ? 's' : ''}</span>
                          <span className="truncate" title={documentUrl}>
                            {documentUrl.length > 40 ? `...${documentUrl.slice(-37)}` : documentUrl}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2 pr-3">
                          {groupRequests.map((request) => {
                            const currentGroupSelections = selectedRequests.filter(id => 
                              groupRequests.some((req: RequestSummary) => req.id === id)
                            );
                            const isDisabled = !selectedRequests.includes(request.id) && currentGroupSelections.length >= 2;
                            
                            return (
                              <div
                                key={request.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedRequests.includes(request.id)
                                    ? 'border-primary bg-primary/5'
                                    : isDisabled
                                    ? 'border-border bg-muted/20 opacity-50 cursor-not-allowed'
                                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                }`}
                                onClick={() => !isDisabled && handleRequestToggle(request.id, documentUrl)}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={selectedRequests.includes(request.id)}
                                    onCheckedChange={() => !isDisabled && handleRequestToggle(request.id, documentUrl)}
                                    disabled={isDisabled}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2">
                                      {request.success ? (
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                      )}
                                      <Badge variant={request.success ? 'default' : 'destructive'} className="text-xs">
                                        {request.success ? 'Success' : 'Failed'}
                                      </Badge>
                                    </div>
                                    
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                        <span className="text-muted-foreground text-xs">
                                          {formatTimestamp(request.timestamp)}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <span>Questions: {request.questions_count || 0}</span>
                                        <span>Time: {formatProcessingTime(request.processing_time)}</span>
                                      </div>
                                      
                                      {request.vector_store && (
                                        <div className="text-xs text-muted-foreground">
                                          Store: {request.vector_store}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </ScrollArea>
        
        {selectedRequests.length > 0 && (
          <div className="px-6 py-4 border-t bg-background">
            <div className="text-sm text-muted-foreground mb-2">
              Selected: {selectedRequests.length} / 2 requests
            </div>
            <Button
              onClick={() => onSelectionChange([])}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
