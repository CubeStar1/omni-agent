'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DiffViewerProps {
  title: string;
  text1: string;
  text2: string;
  label1?: string;
  label2?: string;
  enableHighlighting?: boolean; // New prop to control highlighting
}

export function DiffViewer({ title, text1, text2, label1 = "Request 1", label2 = "Request 2", enableHighlighting = false }: DiffViewerProps) {
  const { commonWords, differences } = useMemo(() => {
    // Only calculate differences if highlighting is enabled
    if (!enableHighlighting) {
      return {
        commonWords: [],
        differences: { unique1: [], unique2: [] }
      };
    }

    // Clean and preprocess text
    const cleanText = (text: string) => {
      return text
        // Remove HTML tags
        .replace(/<[^>]*>/g, ' ')
        // Remove CSS classes (words starting with common CSS prefixes)
        .replace(/\b(?:bg-|text-|border-|hover:|dark:|px-|py-|p-|m-|w-|h-|flex|grid|rounded|shadow|opacity|transform|transition)[a-z0-9-]*/gi, ' ')
        // Remove common CSS units and values
        .replace(/\b\d+(?:px|rem|em|%|vh|vw|fr)\b/gi, ' ')
        // Remove color codes
        .replace(/#[a-f0-9]{3,6}/gi, ' ')
        // Remove multiple spaces and normalize
        .replace(/\s+/g, ' ')
        .trim();
    };

    const words1 = cleanText(text1).toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && word.length < 50 && !/^[0-9]+$/.test(word)); // Filter meaningful words
    const words2 = cleanText(text2).toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && word.length < 50 && !/^[0-9]+$/.test(word));
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const common = [...set1].filter(word => set2.has(word));
    const unique1 = [...set1].filter(word => !set2.has(word));
    const unique2 = [...set2].filter(word => !set1.has(word));
    
    return {
      commonWords: common,
      differences: {
        unique1,
        unique2
      }
    };
  }, [text1, text2, enableHighlighting]);

  const highlightDifferences = (text: string, uniqueWords: string[], isFirst: boolean) => {
    let highlightedText = text;
    
    // Filter out CSS-related words from highlighting
    const meaningfulWords = uniqueWords.filter(word => 
      !word.match(/^(?:bg-|text-|border-|hover:|dark:|px-|py-|p-|m-|w-|h-|flex|grid|rounded|shadow|opacity|transform|transition)/i) &&
      !word.match(/^\d+(?:px|rem|em|%|vh|vw|fr)$/i) &&
      !word.match(/^#[a-f0-9]{3,6}$/i) &&
      word.length > 2
    );
    
    meaningfulWords.forEach(word => {
      // Escape special regex characters
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        const className = isFirst 
          ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 px-1 rounded' 
          : 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 px-1 rounded';
        highlightedText = highlightedText.replace(regex, `<span class="${className}">$&</span>`);
      } catch (error) {
        // If regex fails, skip this word
        console.warn(`Failed to create regex for word: ${word}`, error);
      }
    });
    
    return highlightedText;
  };

  const similarity = useMemo(() => {
    // Only calculate similarity if highlighting is enabled
    if (!enableHighlighting) {
      return '0';
    }
    
    try {
      const allWords1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      const allWords2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      const totalUniqueWords = new Set([...allWords1, ...allWords2]).size;
      const commonWordsCount = commonWords.length;
      return totalUniqueWords > 0 ? (commonWordsCount / totalUniqueWords * 100).toFixed(1) : '0';
    } catch (error) {
      console.warn('Failed to calculate similarity:', error);
      return '0';
    }
  }, [text1, text2, commonWords, enableHighlighting]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {enableHighlighting && (
            <Badge variant="outline">
              {similarity}% similar
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{label1}</Badge>
              {enableHighlighting && differences.unique1.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {differences.unique1.length} unique words
                </Badge>
              )}
            </div>
            <div 
              className="text-sm p-3 bg-muted/50 rounded border min-h-[100px]"
              {...(enableHighlighting 
                ? { dangerouslySetInnerHTML: { __html: highlightDifferences(text1, differences.unique1, true) } }
                : { children: text1 }
              )}
            />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{label2}</Badge>
              {enableHighlighting && differences.unique2.length > 0 && (
                <Badge variant="default" className="text-xs">
                  {differences.unique2.length} unique words
                </Badge>
              )}
            </div>
            <div 
              className="text-sm p-3 bg-muted/50 rounded border min-h-[100px]"
              {...(enableHighlighting 
                ? { dangerouslySetInnerHTML: { __html: highlightDifferences(text2, differences.unique2, false) } }
                : { children: text2 }
              )}
            />
          </div>
        </div>
        
        {enableHighlighting && commonWords.length > 0 && (
          <div className="pt-4 border-t">
            <h5 className="font-medium text-sm text-muted-foreground mb-2">
              Common Keywords ({commonWords.length})
            </h5>
            <div className="flex flex-wrap gap-1">
              {commonWords.slice(0, 20).map((word, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {word}
                </Badge>
              ))}
              {commonWords.length > 20 && (
                <Badge variant="outline" className="text-xs">
                  +{commonWords.length - 20} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
