
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Scale, PlusCircle, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

const weightEntrySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  weight: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() !== '' ? parseFloat(val) : NaN),
    z.number({invalid_type_error: "Weight must be a number."}).min(1, "Weight must be a positive number.").max(500, "Weight seems too high.")
  ),
});

type WeightEntryFormData = z.infer<typeof weightEntrySchema>;

interface StoredWeightEntry extends WeightEntryFormData {
  id: string;
}

interface WeightChartDataPoint {
  date: string; // Formatted for chart label e.g. "MMM d"
  weight: number;
  fullDate: string; // YYYY-MM-DD for sorting/tooltip
}

const WEIGHT_LOG_STORAGE_KEY = 'weightLogEntries';

export default function WeightTrackerPage() {
  const [weightLog, setWeightLog] = useState<StoredWeightEntry[]>([]);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | undefined>(startOfDay(new Date()));
  const { toast } = useToast();

  const { handleSubmit, register, setValue, watch, formState: { errors } } = useForm<WeightEntryFormData>({
    resolver: zodResolver(weightEntrySchema),
    defaultValues: {
      date: format(selectedDateForEntry || new Date(), 'yyyy-MM-dd'),
      weight: undefined,
    },
  });
  
  useEffect(() => {
    if (selectedDateForEntry) {
      const dateStr = format(selectedDateForEntry, 'yyyy-MM-dd');
      setValue("date", dateStr);
      const existingEntry = weightLog.find(entry => entry.date === dateStr);
      setValue("weight", existingEntry ? existingEntry.weight : undefined);
    }
  }, [selectedDateForEntry, setValue, weightLog]);

  useEffect(() => {
    const storedLog = localStorage.getItem(WEIGHT_LOG_STORAGE_KEY);
    if (storedLog) {
      const parsedLog: StoredWeightEntry[] = JSON.parse(storedLog);
      setWeightLog(parsedLog.map(entry => ({...entry, date: format(parseISO(entry.date), 'yyyy-MM-dd')})));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WEIGHT_LOG_STORAGE_KEY, JSON.stringify(weightLog));
  }, [weightLog]);

  const onSubmit = (data: WeightEntryFormData) => {
    const entryDateStr = format(parseISO(data.date), 'yyyy-MM-dd');
    const existingEntryIndex = weightLog.findIndex(entry => entry.date === entryDateStr);

    if (existingEntryIndex > -1) {
      const updatedLog = [...weightLog];
      updatedLog[existingEntryIndex] = { ...updatedLog[existingEntryIndex], weight: data.weight };
      setWeightLog(updatedLog.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      toast({ title: "Weight Updated!", description: `Weight for ${format(parseISO(entryDateStr), 'MMM d, yyyy')} updated to ${data.weight} kg.` });
    } else {
      const newEntry: StoredWeightEntry = { ...data, id: crypto.randomUUID(), date: entryDateStr };
      setWeightLog(prev => [...prev, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      toast({ title: "Weight Logged!", description: `${data.weight} kg logged for ${format(parseISO(entryDateStr), 'MMM d, yyyy')}.` });
    }
    setValue("weight", undefined); 
  };
  
  const deleteEntry = (id: string) => {
    setWeightLog(prev => prev.filter(entry => entry.id !== id));
    toast({ title: "Weight Entry Deleted", description: "The weight record has been removed." });
  };

  const weightChartData: WeightChartDataPoint[] = useMemo(() => {
    return weightLog
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ensure sorted by date
      .map(entry => ({
        date: format(parseISO(entry.date), 'MMM d'),
        weight: entry.weight,
        fullDate: entry.date,
      }));
  }, [weightLog]);

  return (
    <div className="space-y-6">
      <PageHeader title="Weight Tracker" description="Log your weight and visualize your progress over time (kg)." icon={Scale} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Log Your Weight</CardTitle>
            <CardDescription>Select a date and enter your weight in kilograms (kg).</CardDescription>
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
                <label htmlFor="weight" className="block text-sm font-medium mb-1">Weight (kg)</label>
                <Input id="weight" type="number" step="0.1" {...register("weight")} placeholder="e.g., 70.5" />
                {errors.weight && <p className="text-destructive text-sm mt-1">{errors.weight.message}</p>}
              </div>
              <Button type="submit" className="w-full sm:w-auto gap-2">
                <PlusCircle className="h-5 w-5" /> {weightLog.find(e => e.date === format(selectedDateForEntry || new Date(), 'yyyy-MM-dd')) ? 'Update Weight' : 'Log Weight'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
            <CardDescription>Your weight progress over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {weightChartData.length > 1 ? ( // Need at least 2 points for a line
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={true} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} kg`, "Weight"]}
                      labelFormatter={(label: string) => {
                        const point = weightChartData.find(d => d.date === label);
                        return point ? format(parseISO(point.fullDate), 'MMMM d, yyyy') : label;
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
                {weightChartData.length <=1 ? "Log at least two weight entries to see your trend graph." : "Log some weight entries to see your chart."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Weight Log History</CardTitle>
           <CardDescription>Review and manage your past weight entries, sorted by most recent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {weightLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
            <Card key={entry.id} className="p-3 flex justify-between items-center group">
              <div>
                <p className="font-medium">{format(parseISO(entry.date), 'MMMM d, yyyy')}</p>
                <p className="text-sm text-primary">{entry.weight} kg</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 md:focus:opacity-0 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this weight entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your weight record of {entry.weight} kg for {format(parseISO(entry.date), 'MMMM d, yyyy')}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteEntry(entry.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          )) : <p className="text-center text-muted-foreground py-4">No weight entries yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
