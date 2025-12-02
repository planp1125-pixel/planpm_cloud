'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { predictInstrumentFailure } from '@/app/actions';
import { mockInstruments } from '@/lib/data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Lightbulb, Loader2 } from 'lucide-react';

const formSchema = z.object({
  instrumentId: z.string().min(1, 'Please select an instrument.'),
  usagePatterns: z.string().min(10, 'Please describe usage patterns in at least 10 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

type Prediction = {
  failureLikelihood: string;
  recommendedActions: string;
};

export function AdvisorForm({ instrumentId: initialInstrumentId }: { instrumentId?: string }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instrumentId: initialInstrumentId || '',
      usagePatterns: mockInstruments.find(i => i.id === initialInstrumentId)?.usagePatterns || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setPrediction(null);
    setError(null);
    
    const instrument = mockInstruments.find(i => i.id === values.instrumentId);
    if (!instrument) {
      setError('Selected instrument not found.');
      setIsLoading(false);
      return;
    }

    const maintenanceHistory = instrument.maintenanceHistory
      .map(h => `${h.date} - ${h.type}: ${h.description} (${h.completed ? 'Completed' : 'Pending'}). Notes: ${h.notes || 'N/A'}`)
      .join('\n');

    try {
      const result = await predictInstrumentFailure({
        instrumentName: instrument.name,
        maintenanceHistory,
        usagePatterns: values.usagePatterns,
      });
      setPrediction(result);
    } catch (e) {
      setError('Failed to get prediction from AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectedInstrumentId = form.watch('instrumentId');

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline">Analyze Instrument</CardTitle>
              <CardDescription>Select an instrument and describe its usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="instrumentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      const instrumentUsage = mockInstruments.find(i => i.id === value)?.usagePatterns || '';
                      form.setValue('usagePatterns', instrumentUsage);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an instrument" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockInstruments.map((instrument) => (
                          <SelectItem key={instrument.id} value={instrument.id}>
                            {instrument.name} ({instrument.serialNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usagePatterns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Patterns</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., High frequency, 8 hours/day, spinning biological samples."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Analyze
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">AI-Powered Recommendation</CardTitle>
          <CardDescription>Results from the predictive analysis will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          {isLoading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          
          {prediction && (
            <div className="space-y-6 w-full animate-in fade-in-50">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Failure Likelihood</h3>
                <p className={`text-2xl font-bold ${prediction.failureLikelihood.toLowerCase() === 'high' ? 'text-destructive' : prediction.failureLikelihood.toLowerCase() === 'medium' ? 'text-accent' : 'text-primary'}`}>{prediction.failureLikelihood}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommended Actions</h3>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    {prediction.recommendedActions}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {!isLoading && !prediction && !error && (
            <div className="text-center text-muted-foreground">
              <Bot className="mx-auto h-12 w-12" />
              <p>Waiting for analysis...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
