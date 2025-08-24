'use client';

import { useState, useEffect } from 'react';
import { HackrxRequest, getMultipleRequestsById, DebugInfo } from '@/lib/queries/hackrx-requests';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, FileText, Target, Zap, Database } from 'lucide-react';
import { DiffViewer } from './diff-viewer';

interface ComparisonViewProps {
  selectedRequests: string[];
}

export function ComparisonView({ selectedRequests }: ComparisonViewProps) {
  const [requests, setRequests] = useState<HackrxRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRequests.length > 0) {
      loadRequests();
    } else {
      setRequests([]);
    }
  }, [selectedRequests]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getMultipleRequestsById(selectedRequests);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatProcessingTime = (time: number) => {
    return `${time.toFixed(2)}s`;
  };

  if (selectedRequests.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2 text-foreground">No Requests Selected</h3>
            <p>Select 1 or 2 requests from the left panel to view their comparison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Loading Comparison...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(80vh)]">
      <div className="space-y-4 pr-4">
        {/* Overview Section */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Requests Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((request, index) => (
              <div key={request.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Request {index + 1}</Badge>
                  <Badge variant={request.success ? 'default' : 'destructive'}>
                    {request.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTimestamp(request.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{request.document_url}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>Processing Time: {formatProcessingTime(request.processing_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>Questions: {request.questions_count || 0}</span>
                  </div>
                  
                  {request.vector_store && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Vector Store:</span>
                      <Badge variant="outline">{request.vector_store}</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Question-Answer Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="side-by-side" className="w-full">
            <TabsList>
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
              <TabsTrigger value="questions">Questions View</TabsTrigger>
              {requests.length === 2 && (
                <TabsTrigger value="diff">Diff View</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="side-by-side" className="space-y-6">
              <QuestionComparisonGrid requests={requests} />
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-6">
              <QuestionByQuestionView requests={requests} />
            </TabsContent>
            
            {requests.length === 2 && (
              <TabsContent value="diff" className="space-y-6">
                <DiffComparisonView requests={requests} />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </ScrollArea>
  );
}

function QuestionComparisonGrid({ requests }: { requests: HackrxRequest[] }) {
  const maxQuestions = Math.max(
    ...requests.map(r => r.raw_response?.debug_info?.length || 0)
  );

  return (
    <div className="space-y-6">
      {Array.from({ length: maxQuestions }, (_, qIndex) => (
        <Card key={qIndex}>
          <CardHeader>
            <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map((request, rIndex) => {
                const debugInfo = request.raw_response?.debug_info?.[qIndex];
                return (
                  <div key={request.id} className="space-y-4">
                    <Badge variant="outline">Request {rIndex + 1}</Badge>
                    {debugInfo ? (
                      <QuestionAnswerCard debugInfo={debugInfo} />
                    ) : (
                      <div className="text-muted-foreground italic">No question at this index</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuestionByQuestionView({ requests }: { requests: HackrxRequest[] }) {
  const allQuestions = requests.flatMap((request, rIndex) => 
    (request.raw_response?.debug_info || []).map((debugInfo, qIndex) => ({
      requestIndex: rIndex,
      questionIndex: qIndex,
      debugInfo,
      requestId: request.id
    }))
  );

  const groupedByQuestion = allQuestions.reduce((acc, item) => {
    const key = item.debugInfo.question;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof allQuestions>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByQuestion).map(([question, items]) => (
        <Card key={question}>
          <CardHeader>
            <CardTitle className="text-lg break-words">{question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <div key={`${item.requestId}-${item.questionIndex}`} className="space-y-4">
                  <Badge variant="outline">Request {item.requestIndex + 1}</Badge>
                  <QuestionAnswerCard debugInfo={item.debugInfo} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuestionAnswerCard({ debugInfo }: { debugInfo: DebugInfo }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-sm text-muted-foreground mb-2">Question</h4>
        <p className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded border-l-4 border-blue-500">
          {debugInfo.question}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-muted-foreground mb-2">Answer</h4>
        <p className="text-sm bg-green-50 dark:bg-green-950 p-3 rounded border-l-4 border-green-500">
          {debugInfo.answer}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="font-medium text-muted-foreground">Chunks Count:</span>
          <span className="ml-1">{debugInfo.chunks_count || 0}</span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Context Docs:</span>
          <span className="ml-1">{debugInfo.context_documents?.length || 0}</span>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h5 className="font-medium text-sm text-muted-foreground mb-2">Context with Scores</h5>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {debugInfo.context_with_scores?.map((context, index) => (
            <div key={index} className="text-xs bg-muted/50 p-2 rounded">
              <div className="flex justify-between items-center mb-1">
                <Badge variant="outline" className="text-xs">
                  Score: {context.similarity_score?.toFixed(4) || 'N/A'}
                </Badge>
                <span className="text-muted-foreground">
                  Chunk {(context.metadata?.chunk_index || 0) + 1}/{context.metadata?.total_chunks || 1}
                </span>
              </div>
              <p className="text-foreground line-clamp-2">{context.content || 'No content available'}</p>
            </div>
          )) || <div className="text-muted-foreground italic">No context available</div>}
        </div>
      </div>
    </div>
  );
}

function DiffComparisonView({ requests }: { requests: HackrxRequest[] }) {
  if (requests.length !== 2) return null;

  const [request1, request2] = requests;
  const debugInfo1 = request1.raw_response?.debug_info || [];
  const debugInfo2 = request2.raw_response?.debug_info || [];
  
  const maxQuestions = Math.max(debugInfo1.length, debugInfo2.length);

  return (
    <div className="space-y-6">
      {/* Overall Comparison */}
      <DiffViewer
        title="Document URLs"
        text1={request1.document_url}
        text2={request2.document_url}
        label1="Request 1"
        label2="Request 2"
        enableHighlighting={false}
      />
      
      {/* Question by Question Diff */}
      {Array.from({ length: maxQuestions }, (_, qIndex) => {
        const q1 = debugInfo1[qIndex];
        const q2 = debugInfo2[qIndex];
        
        if (!q1 && !q2) return null;
        
        return (
          <div key={qIndex} className="space-y-4">
            <h3 className="text-lg font-medium">Question {qIndex + 1} Comparison</h3>
            
            {q1 && q2 && (
              <>
                <DiffViewer
                  title="Questions"
                  text1={q1.question}
                  text2={q2.question}
                  label1="Request 1"
                  label2="Request 2"
                  enableHighlighting={false}
                />
                
                <DiffViewer
                  title="Answers"
                  text1={q1.answer}
                  text2={q2.answer}
                  label1="Request 1"
                  label2="Request 2"
                  enableHighlighting={true}
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Context Documents Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Badge variant="outline" className="mb-2">Request 1 Context</Badge>
                        <div className="space-y-3 max-h-[calc(50vh)] overflow-y-auto">
                          {q1.context_with_scores?.map((context, index) => (
                            <Card key={index} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Chunk {index + 1}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Score: {context.similarity_score?.toFixed(4) || 'N/A'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">
                                  {context.content || 'No content available'}
                                </p>
                                {context.metadata && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Chunk {(context.metadata.chunk_index || 0) + 1} of {context.metadata.total_chunks || 1}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )) || <div className="text-muted-foreground italic">No context documents</div>}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Badge variant="outline" className="mb-2">Request 2 Context</Badge>
                        <div className="space-y-3 max-h-[calc(50vh)] overflow-y-auto">
                          {q2.context_with_scores?.map((context, index) => (
                            <Card key={index} className="border-l-4 border-l-green-500">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Chunk {index + 1}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Score: {context.similarity_score?.toFixed(4) || 'N/A'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">
                                  {context.content || 'No content available'}
                                </p>
                                {context.metadata && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Chunk {(context.metadata.chunk_index || 0) + 1} of {context.metadata.total_chunks || 1}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )) || <div className="text-muted-foreground italic">No context documents</div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Similarity Scores Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Badge variant="outline" className="mb-2">Request 1</Badge>
                        <div className="space-y-1">
                          {q1.context_with_scores?.map((context, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span>Chunk {index + 1}</span>
                              <Badge variant="secondary">
                                {context.similarity_score?.toFixed(4) || 'N/A'}
                              </Badge>
                            </div>
                          )) || <div className="text-muted-foreground italic">No scores available</div>}
                        </div>
                      </div>
                      
                      <div>
                        <Badge variant="outline" className="mb-2">Request 2</Badge>
                        <div className="space-y-1">
                          {q2.context_with_scores?.map((context, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span>Chunk {index + 1}</span>
                              <Badge variant="secondary">
                                {context.similarity_score?.toFixed(4) || 'N/A'}
                              </Badge>
                            </div>
                          )) || <div className="text-muted-foreground italic">No scores available</div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card> */}
              </>
            )}
            
            {q1 && !q2 && (
              <Card>
                <CardContent className="p-4">
                  <Badge variant="destructive" className="mb-2">Only in Request 1</Badge>
                  <QuestionAnswerCard debugInfo={q1} />
                </CardContent>
              </Card>
            )}
            
            {!q1 && q2 && (
              <Card>
                <CardContent className="p-4">
                  <Badge variant="default" className="mb-2">Only in Request 2</Badge>
                  <QuestionAnswerCard debugInfo={q2} />
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
