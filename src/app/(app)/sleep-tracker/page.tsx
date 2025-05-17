
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Bed, BarChart3, PlusCircle, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

const sleepEntrySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  hours: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() !== '' ? parseFloat(val) : NaN),
    z.number({invalid_type_error: "Hours slept must be a number."}).min(0.5, "Sleep must be at least 0.5 hours.").max(24, "Sleep cannot exceed 24 hours.")
  ),
});

type SleepEntryFormData = z.infer<typeof sleepEntrySchema>;

interface StoredSleepEntry extends SleepEntryFormData {
  id: string;
}

interface SleepChartDataPoint {
  date: string; 
  hours: number;
  fullDate: string; 
}

const SLEEP_LOG_STORAGE_KEY = 'sleepLogEntries';
const CHART_DAYS = 7; 

export default function SleepTrackerPage() {
  const [sleepLog, setSleepLog] = useState<StoredSleepEntry[]>([]);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | undefined>(startOfDay(new Date()));
  const { toast } = useToast();

  const { control, handleSubmit, register, reset, setValue, watch, formState: { errors } } = useForm<SleepEntryFormData>({
    resolver: zodResolver(sleepEntrySchema),
    defaultValues: {
      date: format(selectedDateForEntry || new Date(), 'yyyy-MM-dd'),
      hours: undefined,
    },
  });
  
  useEffect(() => {
    if (selectedDateForEntry) {
      const dateStr = format(selectedDateForEntry, 'yyyy-MM-dd');
      setValue("date", dateStr);
      const existingEntry = sleepLog.find(entry => entry.date === dateStr);
      setValue("hours", existingEntry ? existingEntry.hours : undefined);
    }
  }, [selectedDateForEntry, setValue, sleepLog]);

  useEffect(() => {
    const storedLog = localStorage.getItem(SLEEP_LOG_STORAGE_KEY);
    if (storedLog) {
      const parsedLog: StoredSleepEntry[] = JSON.parse(storedLog).map((entry: StoredSleepEntry) => ({
        ...entry,
        date: entry.date, 
      }));
      setSleepLog(parsedLog);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SLEEP_LOG_STORAGE_KEY, JSON.stringify(sleepLog));
  }, [sleepLog]);

  const onSubmit = (data: SleepEntryFormData) => {
    const entryDateStr = format(parseISO(data.date), 'yyyy-MM-dd');
    const existingEntryIndex = sleepLog.findIndex(entry => entry.date === entryDateStr);

    if (existingEntryIndex > -1) {
      const updatedLog = [...sleepLog];
      updatedLog[existingEntryIndex] = { ...updatedLog[existingEntryIndex], hours: data.hours };
      setSleepLog(updatedLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Sleep Updated!", description: `Sleep for ${format(parseISO(entryDateStr), 'MMM d, yyyy')} updated to ${data.hours} hours.` });
    } else {
      const newEntry: StoredSleepEntry = { ...data, id: crypto.randomUUID(), date: entryDateStr };
      setSleepLog(prev => [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Sleep Logged!", description: `${data.hours} hours of sleep logged for ${format(parseISO(entryDateStr), 'MMM d, yyyy')}.` });
    }
    // Keep date, clear hours for potential new entry or re-entry
    setValue("hours", undefined); 
  };
  
  const deleteEntry = (id: string) => {
    setSleepLog(prev => prev.filter(entry => entry.id !== id));
    toast({ title: "Sleep Entry Deleted", description: "The sleep record has been removed." });
  };

  const sleepChartData: SleepChartDataPoint[] = useMemo(() => {
    const today = startOfDay(new Date());
    const dateRange = eachDayOfInterval({
      start: subDays(today, CHART_DAYS -1 ),
      end: today,
    });

    return dateRange.map(dateInInterval => {
      const dateStr = format(dateInInterval, 'yyyy-MM-dd');
      const entry = sleepLog.find(e => e.date === dateStr);
      return {
        date: format(dateInInterval, 'MMM d'),
        hours: entry ? entry.hours : 0,
        fullDate: dateStr,
      };
    }).sort((a,b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [sleepLog]);

  return (
    <div className="space-y-6">
      <PageHeader title="Sleep Tracker" description="Log your sleep hours and visualize your rest patterns." icon={Bed} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Log Your Sleep</CardTitle>
            <CardDescription>Select a date and enter how many hours you slept.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDateForEntry}
                  onSelect={(date) => setSelectedDateForEntry(date ? startOfDay(date) : undefined)}
                  className="rounded-md border p-0 mx-auto sm:mx-0 shadow"
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                  initialFocus
                />
                 {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label htmlFor="hours" className="block text-sm font-medium mb-1">Hours Slept</label>
                <Input id="hours" type="number" step="0.1" {...register("hours")} placeholder="e.g., 7.5" />
                {errors.hours && <p className="text-destructive text-sm mt-1">{errors.hours.message}</p>}
              </div>
              <Button type="submit" className="w-full sm:w-auto gap-2">
                <PlusCircle className="h-5 w-5" /> {sleepLog.find(e => e.date === format(selectedDateForEntry || new Date(), 'yyyy-MM-dd')) ? 'Update Sleep' : 'Log Sleep'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sleep Patterns (Last {CHART_DAYS} Days)</CardTitle>
            <CardDescription>Visualize your sleep duration over the past week.</CardDescription>
          </CardHeader>
          <CardContent>
            {sleepChartData.some(d => d.hours > 0) ? ( // Check if there's any data to display
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={true} domain={[0, 'dataMax + 1']}/>
                    <Tooltip 
                      formatter={(value: number) => [`${value} hrs`, "Sleep"]}
                      labelFormatter={(label: string) => format(parseISO(sleepChartData.find(d => d.date === label)?.fullDate || new Date()), 'MMMM d, yyyy')}
                    />
                    <Legend />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" name="Hours Slept" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
                Log some sleep entries to see your chart.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sleep Log History</CardTitle>
           <CardDescription>Review and manage your past sleep entries, sorted by most recent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {sleepLog.length > 0 ? sleepLog.map(entry => (
            <Card key={entry.id} className="p-3 flex justify-between items-center group">
              <div>
                <p className="font-medium">{format(parseISO(entry.date), 'MMMM d, yyyy')}</p>
                <p className="text-sm text-primary">{entry.hours} hours</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 md:focus:opacity-0 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this sleep entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your sleep record of {entry.hours} hours for {format(parseISO(entry.date), 'MMMM d, yyyy')}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteEntry(entry.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          )) : <p className="text-center text-muted-foreground py-4">No sleep entries yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
