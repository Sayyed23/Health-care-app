
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Utensils, PlusCircle, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

const mealEntrySchema = z.object({
  name: z.string().min(1, "Meal name cannot be empty."),
  calories: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() !== '' ? Number(val) : NaN), // Convert empty or non-numeric to NaN for validation
    z.number({invalid_type_error: "Calories must be a number."}).min(0, "Calories must be zero or a positive number.")
  ),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

type MealEntryFormData = z.infer<typeof mealEntrySchema>;

interface StoredMealEntry extends MealEntryFormData {
  id: string;
}

const MEAL_LOG_STORAGE_KEY = 'mealLogEntries';

export default function MealLogPage() {
  const [mealEntries, setMealEntries] = useState<StoredMealEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const { toast } = useToast();

  const { control, handleSubmit, register, reset, formState: { errors }, watch } = useForm<MealEntryFormData>({
    resolver: zodResolver(mealEntrySchema),
    defaultValues: {
      name: "",
      calories: undefined, 
      date: format(selectedDate, 'yyyy-MM-dd'),
    },
  });

  const formDate = watch("date");

  useEffect(() => {
    const storedEntries = localStorage.getItem(MEAL_LOG_STORAGE_KEY);
    if (storedEntries) {
      const parsedEntries: StoredMealEntry[] = JSON.parse(storedEntries).map((entry: StoredMealEntry) => ({
        ...entry,
        date: entry.date, 
      }));
      setMealEntries(parsedEntries);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(MEAL_LOG_STORAGE_KEY, JSON.stringify(mealEntries));
  }, [mealEntries]);
  
  useEffect(() => {
    // Update selectedDate state when form date input changes by user
    if (formDate) {
        const newSelectedDate = startOfDay(parseISO(formDate));
        if (newSelectedDate.getTime() !== selectedDate.getTime()){
             setSelectedDate(newSelectedDate);
        }
    }
  }, [formDate, selectedDate]);

  useEffect(() => {
    // Reset form with the new selectedDate (e.g. from calendar click or direct input change)
    reset({ date: format(selectedDate, 'yyyy-MM-dd'), name: "", calories: undefined });
  }, [selectedDate, reset]);


  const onSubmit = (data: MealEntryFormData) => {
    const newEntry: StoredMealEntry = { ...data, id: crypto.randomUUID(), date: format(parseISO(data.date), 'yyyy-MM-dd') };
    setMealEntries(prev => [...prev, newEntry].sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        // If dates are same, could sort by time if available, or keep insertion order for same day
        return 0; 
    }));
    reset({ name: "", calories: undefined, date: format(selectedDate, 'yyyy-MM-dd') });
    toast({ title: "Meal Logged!", description: `${data.name} added to your log.` });
  };

  const deleteEntry = (id: string) => {
    setMealEntries(prev => prev.filter(entry => entry.id !== id));
    toast({ title: "Meal Deleted", description: "The meal entry has been removed." });
  };

  const mealsForSelectedDate = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return mealEntries.filter(entry => entry.date === dateStr);
  }, [mealEntries, selectedDate]);

  const totalCaloriesForSelectedDate = useMemo(() => {
    return mealsForSelectedDate.reduce((sum, entry) => sum + entry.calories, 0);
  }, [mealsForSelectedDate]);

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Log" description="Track your daily meals and calorie intake." icon={Utensils} />

      <Card>
        <CardHeader>
          <CardTitle>Log a New Meal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
                <Input 
                  type="date" 
                  id="date" 
                  {...register("date")}
                  // value={format(selectedDate, 'yyyy-MM-dd')} // Controlled by react-hook-form defaultValues & reset
                  // onChange={(e) => setSelectedDate(startOfDay(parseISO(e.target.value)))} // react-hook-form handles this via register
                />
                {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium mb-1">Meal Name</label>
                <Input id="name" {...register("name")} placeholder="e.g., Chicken Salad" />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="calories" className="block text-sm font-medium mb-1">Calories (kcal)</label>
              <Input id="calories" type="number" {...register("calories")} placeholder="e.g., 350" />
              {errors.calories && <p className="text-destructive text-sm mt-1">{errors.calories.message}</p>}
            </div>
            <Button type="submit" className="w-full sm:w-auto gap-2">
              <PlusCircle className="h-5 w-5" /> Add Meal
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Summary for {format(selectedDate, 'MMMM d, yyyy')}</span>
            <Badge variant="secondary" className="text-lg px-3 py-1 shrink-0">
              Total: {totalCaloriesForSelectedDate} kcal
            </Badge>
          </CardTitle>
           <CardDescription>Overview of your calorie intake for the selected day.</CardDescription>
        </CardHeader>
        <CardContent>
          {mealsForSelectedDate.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No meals logged for this day.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {mealsForSelectedDate.map(entry => (
                <li key={entry.id} className="p-3 bg-muted/50 rounded-md flex justify-between items-center group">
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-primary">{entry.calories} kcal</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 md:focus:opacity-0 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this meal?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the meal "{entry.name}" ({entry.calories} kcal) logged on {format(parseISO(entry.date), 'MMMM d, yyyy')}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEntry(entry.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
