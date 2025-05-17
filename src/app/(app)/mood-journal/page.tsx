
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookText, Tag, BarChart3, Lightbulb, RefreshCw, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateMoodChart, type GenerateMoodChartInput, type GenerateMoodChartOutput } from '@/ai/flows/generate-mood-chart';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { JOURNAL_TAG_SUGGESTIONS } from '@/lib/constants';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const journalEntrySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  text: z.string().min(10, "Journal entry must be at least 10 characters long."),
  tags: z.string().optional(), // Comma-separated tags
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

interface StoredJournalEntry extends JournalEntryFormData {
  id: string;
}

interface MoodChartDataPoint {
  date: string; // formatted date string
  moodScore: number;
}

export default function MoodJournalPage() {
  const [journalEntries, setJournalEntries] = useState<StoredJournalEntry[]>([]);
  const [moodChartData, setMoodChartData] = useState<MoodChartDataPoint[] | null>(null);
  const [moodSummary, setMoodSummary] = useState<string | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, register, reset, formState: { errors }, setValue, watch } = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      text: "",
      tags: "",
    },
  });

  useEffect(() => {
    const storedEntries = localStorage.getItem('moodJournalEntries');
    if (storedEntries) {
      setJournalEntries(JSON.parse(storedEntries));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('moodJournalEntries', JSON.stringify(journalEntries));
    if (journalEntries.length > 0) {
      handleGenerateChart(); // Auto-generate chart if entries exist
    } else {
      setMoodChartData(null);
      setMoodSummary(null);
    }
  }, [journalEntries]);

  const onSubmit = (data: JournalEntryFormData) => {
    const newEntry: StoredJournalEntry = { ...data, id: crypto.randomUUID() };
    setJournalEntries(prev => [newEntry, ...prev.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())]);
    reset({ date: format(new Date(), 'yyyy-MM-dd'), text: "", tags: "" });
    toast({ title: "Journal Entry Saved!", description: "Your thoughts have been recorded." });
  };

  const handleGenerateChart = async () => {
    if (journalEntries.length === 0) {
      toast({ title: "No Entries", description: "Write some journal entries to generate a mood chart.", variant: "destructive" });
      return;
    }
    setIsLoadingChart(true);
    try {
      const input: GenerateMoodChartInput = {
        journalEntries: journalEntries.map(entry => ({
          date: entry.date,
          text: entry.text,
          tags: entry.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
        })),
      };
      const result: GenerateMoodChartOutput = await generateMoodChart(input);
      
      // The AI returns chartData as a JSON string. We need to parse it.
      const parsedChartData = JSON.parse(result.chartData) as Array<{date: string; moodScore: number}>;

      setMoodChartData(parsedChartData.map(d => ({...d, date: format(parseISO(d.date), 'MMM d')})));
      setMoodSummary(result.summary);
      toast({ title: "Mood Chart Updated", description: "Insights from your journal are ready." });
    } catch (error) {
      console.error("Failed to generate mood chart:", error);
      toast({ title: "Chart Generation Failed", description: (error as Error).message || "Could not generate mood chart.", variant: "destructive" });
      setMoodChartData(null);
      setMoodSummary("Failed to generate summary.");
    } finally {
      setIsLoadingChart(false);
    }
  };
  
  const deleteEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(entry => entry.id !== id));
    toast({ title: "Entry Deleted", description: "The journal entry has been removed." });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mood Journal" description="Reflect on your thoughts and feelings. Track your mood over time with AI-powered insights." icon={BookText} />

      <Card>
        <CardHeader>
          <CardTitle>New Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
              <Input type="date" id="date" {...register("date")} />
              {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label htmlFor="text" className="block text-sm font-medium mb-1">Your Thoughts</label>
              <Textarea id="text" {...register("text")} rows={5} placeholder="How was your day? What's on your mind?" />
              {errors.text && <p className="text-destructive text-sm mt-1">{errors.text.message}</p>}
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <Input id="tags" {...register("tags")} placeholder="e.g., grateful, stressed, productive" />
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground mr-1"><Lightbulb className="inline h-3 w-3 mr-1"/>Suggestions:</span>
                {JOURNAL_TAG_SUGGESTIONS.slice(0,5).map(tag => (
                  <Button 
                    key={tag} 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6 px-1.5 py-0.5"
                    onClick={() => {
                      const currentTags = watch('tags') || "";
                      const newTags = currentTags ? `${currentTags.split(',').map(t => t.trim()).filter(Boolean).includes(tag) ? currentTags : `${currentTags}, ${tag}`}` : tag;
                      setValue('tags', newTags.split(',').map(t => t.trim()).filter(Boolean).join(', '));
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Save Entry</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mood Analysis</CardTitle>
            <CardDescription>AI-generated chart and summary based on your entries.</CardDescription>
          </div>
          <Button onClick={handleGenerateChart} disabled={isLoadingChart || journalEntries.length === 0} className="gap-2">
            {isLoadingChart ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            {isLoadingChart ? "Generating..." : "Refresh Chart"}
          </Button>
        </CardHeader>
        <CardContent>
          {moodChartData && moodChartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="moodScore" fill="hsl(var(--primary))" name="Mood Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              {journalEntries.length === 0 ? "Write some journal entries to see your mood chart." : "Click 'Refresh Chart' to generate your mood analysis."}
            </p>
          )}
          {moodSummary && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-1">AI Summary:</h4>
              <p className="text-sm text-muted-foreground">{moodSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Past Entries</CardTitle>
           <CardDescription>Review and manage your previous journal entries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
          {journalEntries.length > 0 ? journalEntries.map(entry => (
            <Card key={entry.id} className="p-4 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{format(parseISO(entry.date), 'MMMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{entry.text}</p>
                  {entry.tags && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your journal entry from {format(parseISO(entry.date), 'MMMM d, yyyy')}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteEntry(entry.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          )) : <p className="text-center text-muted-foreground">No entries yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
