'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CSVViewerProps {
    data: string
    className?: string
}

export function CSVViewer({ data, className }: CSVViewerProps) {
    // Parse CSV data
    const parseCSV = (csvText: string) => {
        const lines = csvText.split('\n')
        return lines.map(line => 
            line.split(',').map(cell => 
                // Remove quotes and trim whitespace
                cell.replace(/^["']|["']$/g, '').trim()
            )
        ).filter(row => row.some(cell => cell.length > 0)) // Remove empty rows
    }

    const rows = parseCSV(data)
    const headers = rows[0] || []
    const content = rows.slice(1)

    // Helper function to format cell content
    const formatCell = (text: string) => {
        if (!text) return '-'
        // If it's a long text, truncate it
        if (text.length > 50) {
            return text.substring(0, 47) + '...'
        }
        return text
    }

    return (
        <div className={className}>
            <ScrollArea className="h-full">
                <div className="max-w-[calc(100vw-32px)]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map((header, index) => (
                                    <TableHead 
                                        key={index}
                                        className="min-w-[150px]"
                                        title={header}
                                    >
                                        {formatCell(header)}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {content.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell 
                                            key={cellIndex}
                                            className="truncate"
                                        >
                                            <div 
                                                className="hover:overflow-visible hover:whitespace-normal hover:break-all"
                                                title={cell}
                                            >
                                                {formatCell(cell)}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            {content.length === 0 && (
                                <TableRow>
                                    <TableCell 
                                        colSpan={headers.length} 
                                        className="text-center h-24 text-muted-foreground"
                                    >
                                        No data available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>
        </div>
    )
} 