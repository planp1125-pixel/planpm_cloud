'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, CheckCircle, XCircle, Calendar, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { MaintenanceEvent, TestSection } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewMaintenanceResultDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    maintenanceEvent: MaintenanceEvent;
    instrumentId: string;
}

interface ResultData {
    id: string;
    completedDate: string;
    resultType: string;
    notes?: string;
    documentUrl?: string;
    testData?: TestSection[];
}

export function ViewMaintenanceResultDialog({
    isOpen,
    onOpenChange,
    maintenanceEvent,
    instrumentId,
}: ViewMaintenanceResultDialogProps) {
    const [result, setResult] = useState<ResultData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [instrumentInfo, setInstrumentInfo] = useState<{ eqpId: string; model: string; make: string } | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!isOpen) return;

            setIsLoading(true);

            // Fetch instrument information
            const { data: instrument } = await supabase
                .from('instruments')
                .select('eqpId, model, make')
                .eq('id', instrumentId)
                .single();

            if (instrument) {
                setInstrumentInfo(instrument);
            }

            const { data } = await supabase
                .from('maintenanceResults')
                .select('*')
                .eq('maintenanceScheduleId', maintenanceEvent.id)
                .single();

            if (data) {
                setResult(data);
            }
            setIsLoading(false);
        };

        fetchResult();
    }, [isOpen, maintenanceEvent.id, instrumentId]);

    const getOverallStatus = (testData: TestSection[] | undefined) => {
        if (!testData || testData.length === 0) return null;

        let totalRows = 0;
        let passedRows = 0;

        testData.forEach(section => {
            section.rows?.forEach(row => {
                if (row.passed !== undefined) {
                    totalRows++;
                    if (row.passed) passedRows++;
                }
            });
        });

        if (totalRows === 0) return null;
        return { passed: passedRows, total: totalRows, allPass: passedRows === totalRows };
    };

    const overallStatus = result?.testData ? getOverallStatus(result.testData) : null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <DialogTitle className="flex items-center gap-2 flex-wrap">
                                Maintenance Result
                                {instrumentInfo && (
                                    <Badge variant="outline" className="font-mono text-base px-3 py-1">
                                        {instrumentInfo.eqpId}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <div className="mt-2 text-sm text-muted-foreground">
                                {instrumentInfo && (
                                    <div className="text-sm mb-1">
                                        <span className="font-medium">{instrumentInfo.make} {instrumentInfo.model}</span>
                                    </div>
                                )}
                                <div>
                                    {maintenanceEvent.type} - {maintenanceEvent.description}
                                </div>
                            </div>
                        </div>
                        {overallStatus && (
                            <Badge className={cn(
                                "text-sm px-3 py-1 ml-4",
                                overallStatus.allPass
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            )}>
                                {overallStatus.allPass ? (
                                    <><CheckCircle className="w-4 h-4 mr-1" /> All Pass ({overallStatus.passed}/{overallStatus.total})</>
                                ) : (
                                    <><XCircle className="w-4 h-4 mr-1" /> {overallStatus.total - overallStatus.passed} Failed</>
                                )}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : result ? (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Completed Date & Time</div>
                                            <div className="font-medium flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <div className="flex flex-col">
                                                    <span>{format(new Date(result.completedDate), 'PPP')}</span>
                                                    <span className="text-sm text-muted-foreground">{format(new Date(result.completedDate), 'p')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Result Type</div>
                                            <Badge variant="outline" className="mt-1 capitalize">
                                                {result.resultType.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Main Document</div>
                                            {result.documentUrl ? (
                                                <a
                                                    href={result.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline mt-1"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    View Certificate
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No document attached</span>
                                            )}
                                        </div>
                                    </div>

                                    {result.notes && (
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="text-sm text-muted-foreground mb-1">Notes</div>
                                            <div className="text-sm">{result.notes}</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Test Data */}
                            {result.testData && result.testData.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Test Results</h4>

                                    {result.testData.map((section, sectionIndex) => (
                                        <Card key={section.id || sectionIndex}>
                                            <CardHeader className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base">{section.title}</CardTitle>
                                                    {section.type === 'tolerance' && (
                                                        <Badge variant="outline">±{section.tolerance} {section.unit}</Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="rounded-lg border overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-muted/50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left font-medium">Label</th>
                                                                {section.type === 'tolerance' && <th className="px-4 py-2 text-left font-medium">Reference</th>}
                                                                {section.type === 'range' && (
                                                                    <>
                                                                        <th className="px-4 py-2 text-left font-medium">Min</th>
                                                                        <th className="px-4 py-2 text-left font-medium">Max</th>
                                                                    </>
                                                                )}
                                                                <th className="px-4 py-2 text-left font-medium">Measured</th>
                                                                {section.type === 'tolerance' && <th className="px-4 py-2 text-left font-medium">Error</th>}
                                                                <th className="px-4 py-2 text-center font-medium">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {section.rows?.map((row, rowIndex) => (
                                                                <tr key={row.id || rowIndex} className="border-t">
                                                                    <td className="px-4 py-2 font-medium">{row.label}</td>
                                                                    {section.type === 'tolerance' && (
                                                                        <td className="px-4 py-2 text-muted-foreground">{row.reference} {row.unit || section.unit}</td>
                                                                    )}
                                                                    {section.type === 'range' && (
                                                                        <>
                                                                            <td className="px-4 py-2 text-muted-foreground">{row.min ?? '-'}</td>
                                                                            <td className="px-4 py-2 text-muted-foreground">{row.max ?? '-'}</td>
                                                                        </>
                                                                    )}
                                                                    <td className="px-4 py-2 font-mono font-medium">
                                                                        {row.measured !== undefined ? row.measured : '-'}
                                                                    </td>
                                                                    {section.type === 'tolerance' && (
                                                                        <td className={cn(
                                                                            "px-4 py-2 font-mono",
                                                                            row.error !== undefined && (row.passed ? "text-green-600" : "text-red-600")
                                                                        )}>
                                                                            {row.error !== undefined ? (row.error >= 0 ? '+' : '') + row.error.toFixed(3) : '-'}
                                                                        </td>
                                                                    )}
                                                                    <td className="px-4 py-2 text-center">
                                                                        {row.passed !== undefined ? (
                                                                            row.passed ? (
                                                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                                    <CheckCircle className="w-3 h-3 mr-1" /> Pass
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                                    <XCircle className="w-3 h-3 mr-1" /> Fail
                                                                                </Badge>
                                                                            )
                                                                        ) : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Section Document */}
                                                {section.documentUrl && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <div className="text-sm text-muted-foreground mb-2">Test Document:</div>
                                                        {section.documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                            <div className="space-y-2">
                                                                <img
                                                                    src={section.documentUrl}
                                                                    alt="Section document"
                                                                    className="max-w-full h-auto rounded border"
                                                                    style={{ maxHeight: '400px' }}
                                                                />
                                                                <a
                                                                    href={section.documentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    View Full Image
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <a
                                                                href={section.documentUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                                View Test Document
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Main Result Document Display */}
                            {result.documentUrl && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Main Certificate/Report</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {result.documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={result.documentUrl}
                                                    alt="Main result document"
                                                    className="max-w-full h-auto rounded border"
                                                    style={{ maxHeight: '500px' }}
                                                />
                                                <a
                                                    href={result.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    View Full Image
                                                </a>
                                            </div>
                                        ) : (
                                            <a
                                                href={result.documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-primary hover:underline"
                                            >
                                                <FileText className="w-4 h-4" />
                                                View Certificate/Report
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No result data found.
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
