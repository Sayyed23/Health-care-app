
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Scale, PlusCircle, Trash2, Calculator, Sparkles, Lightbulb, User, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { generateDietSuggestions, type GenerateDietSuggestionsInput, type GenerateDietSuggestionsOutput } from '@/ai/flows/generate-diet-suggestions-flow';
import { Skeleton } from '@/components/ui/skeleton';

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
  date: string; 
  weight: number;
  fullDate: string; 
}

const WEIGHT_LOG_STORAGE_KEY = 'weightLogEntries';
const USER_HEIGHT_STORAGE_KEY = 'userHeightCm';
const USER_AGE_STORAGE_KEY = 'userAgeYears'; // Key for storing age

export default function WeightTrackerPage() {
  const [weightLog, setWeightLog] = useState<StoredWeightEntry[]>([]);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | undefined>(startOfDay(new Date()));
  const { toast } = useToast();

  const [userHeightCm, setUserHeightCm] = useState<number | undefined>(undefined);
  const [userAge, setUserAge] = useState<number | undefined>(undefined); // State for user's age
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string | null>(null);
  const [dietSuggestions, setDietSuggestions] = useState<GenerateDietSuggestionsOutput | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);


  const { handleSubmit, register, setValue, formState: { errors } } = useForm<WeightEntryFormData>({
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
    const storedHeight = localStorage.getItem(USER_HEIGHT_STORAGE_KEY);
    if (storedHeight) {
      setUserHeightCm(parseFloat(storedHeight));
    }
    const storedAge = localStorage.getItem(USER_AGE_STORAGE_KEY); // Load age
    if (storedAge) {
      setUserAge(parseInt(storedAge, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WEIGHT_LOG_STORAGE_KEY, JSON.stringify(weightLog));
  }, [weightLog]);

  useEffect(() => {
    if (userHeightCm !== undefined) {
      localStorage.setItem(USER_HEIGHT_STORAGE_KEY, userHeightCm.toString());
    }
  }, [userHeightCm]);

  useEffect(() => { // Save age to local storage
    if (userAge !== undefined) {
      localStorage.setItem(USER_AGE_STORAGE_KEY, userAge.toString());
    }
  }, [userAge]);

  const onSubmit = (data: WeightEntryFormData) => {
    const entryDateStr = format(parseISO(data.date), 'yyyy-MM-dd');
    const existingEntryIndex = weightLog.findIndex(entry => entry.date === entryDateStr);

    let updatedLog;
    if (existingEntryIndex > -1) {
      updatedLog = [...weightLog];
      updatedLog[existingEntryIndex] = { ...updatedLog[existingEntryIndex], weight: data.weight };
      toast({ title: "Weight Updated!", description: `Weight for ${format(parseISO(entryDateStr), 'MMM d, yyyy')} updated to ${data.weight} kg.` });
    } else {
      const newEntry: StoredWeightEntry = { ...data, id: crypto.randomUUID(), date: entryDateStr };
      updatedLog = [...weightLog, newEntry];
      toast({ title: "Weight Logged!", description: `${data.weight} kg logged for ${format(parseISO(entryDateStr), 'MMM d, yyyy')}.` });
    }
    // Sort by date ascending for chart consistency
    setWeightLog(updatedLog.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setValue("weight", undefined);
    setBmi(null);
    setBmiCategory(null);
    setDietSuggestions(null);
  };
  
  const deleteEntry = (id: string) => {
    setWeightLog(prev => prev.filter(entry => entry.id !== id));
    toast({ title: "Weight Entry Deleted", description: "The weight record has been removed." });
  };

  const getBmiCategoryText = (calculatedBmi: number): string => {
    if (calculatedBmi < 18.5) return "Underweight";
    if (calculatedBmi < 25) return "Normal weight";
    if (calculatedBmi < 30) return "Overweight";
    if (calculatedBmi < 35) return "Obesity Class I";
    if (calculatedBmi < 40) return "Obesity Class II";
    return "Obesity Class III";
  };

  const handleCalculateBmiAndSuggest = async () => {
    if (!userHeightCm || userHeightCm <=0) {
      toast({ title: "Height Required", description: "Please enter your height to calculate BMI.", variant: "destructive" });
      return;
    }
    if (!userAge || userAge <= 0) { // Check for age
      toast({ title: "Age Required", description: "Please enter your age for personalized suggestions.", variant: "destructive" });
      return;
    }
    if (weightLog.length === 0) {
      toast({ title: "Weight Log Required", description: "Please log your weight first to calculate BMI.", variant: "destructive" });
      return;
    }

    const latestWeightEntry = weightLog.reduce((latest, entry) => 
        new Date(latest.date) > new Date(entry.date) ? latest : entry
    );
    
    const heightInMeters = userHeightCm / 100;
    const calculatedBmi = parseFloat((latestWeightEntry.weight / (heightInMeters * heightInMeters)).toFixed(1));
    const category = getBmiCategoryText(calculatedBmi);

    setBmi(calculatedBmi);
    setBmiCategory(category);
    setDietSuggestions(null); 
    setIsFetchingSuggestions(true);

    try {
      const input: GenerateDietSuggestionsInput = {
        bmi: calculatedBmi,
        bmiCategory: category,
        currentWeightKg: latestWeightEntry.weight,
        heightCm: userHeightCm,
        age: userAge, // Pass age to the flow
      };
      const suggestions = await generateDietSuggestions(input);
      setDietSuggestions(suggestions);
      toast({title: "Suggestions Ready!", description: "Personalized diet and lifestyle tips generated."});
    } catch (error) {
      console.error("Error generating diet suggestions:", error);
      toast({ title: "Suggestion Error", description: (error instanceof Error ? error.message : "Could not fetch suggestions."), variant: "destructive" });
      setDietSuggestions({mainSuggestion: "Could not load suggestions.", dietTips:[], lifestyleRecommendations:[]});
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const weightChartData: WeightChartDataPoint[] = useMemo(() => {
    return weightLog.map(entry => ({
      date: format(parseISO(entry.date), 'MMM d'),
      weight: entry.weight,
      fullDate: entry.date,
    }));
    // No need to sort here if weightLog is already sorted on update/add
  }, [weightLog]);
  
  const latestWeightForBmi = weightLog.length > 0 ? weightLog[weightLog.length-1].weight : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Weight Tracker" description="Log weight (kg), calculate BMI, enter age for AI diet suggestions." icon={Scale} />
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Your Weight</CardTitle>
              <CardDescription>Select date and enter weight in kilograms (kg).</CardDescription>
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
                <Button type="submit" className="w-full gap-2">
                  <PlusCircle className="h-5 w-5" /> {weightLog.find(e => e.date === format(selectedDateForEntry || new Date(), 'yyyy-MM-dd')) ? 'Update Weight' : 'Log Weight'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-6 w-6 text-primary"/>BMI & Diet Helper</CardTitle>
              <CardDescription>Enter height & age for BMI & AI suggestions. Latest weight: ({latestWeightForBmi ? `${latestWeightForBmi} kg` : "N/A"}).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userHeight" className="block text-sm font-medium mb-1">Height (cm)</label>
                  <Input 
                    id="userHeight" 
                    type="number" 
                    placeholder="e.g., 170" 
                    value={userHeightCm === undefined ? '' : userHeightCm}
                    onChange={(e) => {
                        const val = e.target.value;
                        setUserHeightCm(val === '' ? undefined : parseFloat(val));
                        setBmi(null); 
                        setDietSuggestions(null);
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="userAge" className="block text-sm font-medium mb-1">Age (years)</label>
                  <Input 
                    id="userAge" 
                    type="number" 
                    placeholder="e.g., 30" 
                    value={userAge === undefined ? '' : userAge}
                    onChange={(e) => {
                        const val = e.target.value;
                        setUserAge(val === '' ? undefined : parseInt(val, 10));
                        setDietSuggestions(null);
                    }}
                  />
                </div>
              </div>
              <Button 
                onClick={handleCalculateBmiAndSuggest} 
                className="w-full gap-2"
                disabled={userHeightCm === undefined || userHeightCm <=0 || userAge === undefined || userAge <= 0 || weightLog.length === 0 || isFetchingSuggestions}
              >
                {isFetchingSuggestions ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {isFetchingSuggestions ? "Getting Info..." : "Calculate BMI & Get Suggestions"}
              </Button>
              {bmi !== null && bmiCategory && (
                <div className="mt-4 p-3 bg-muted rounded-md text-center">
                  <p className="text-lg font-semibold">Your BMI: <span className="text-primary">{bmi}</span></p>
                  <p className="text-sm text-muted-foreground">Category: {bmiCategory}</p>
                </div>
              )}
            </CardContent>
            {isFetchingSuggestions && !dietSuggestions && (
                 <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                 </CardContent>
            )}
            {dietSuggestions && (
              <CardContent className="space-y-3 pt-0">
                <h4 className="font-semibold text-md flex items-center gap-1"><Lightbulb className="h-5 w-5 text-primary"/>AI Suggestions:</h4>
                {dietSuggestions.mainSuggestion && <p className="text-sm italic border-l-2 border-primary pl-2 py-1 bg-primary/5 rounded-r-md">{dietSuggestions.mainSuggestion}</p>}
                
                {dietSuggestions.dietTips && dietSuggestions.dietTips.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-1">Diet Tips:</h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {dietSuggestions.dietTips.map((tip, index) => <li key={`diet-${index}`}>{tip}</li>)}
                    </ul>
                  </div>
                )}
                {dietSuggestions.lifestyleRecommendations && dietSuggestions.lifestyleRecommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-1">Lifestyle Recommendations:</h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {dietSuggestions.lifestyleRecommendations.map((tip, index) => <li key={`lifestyle-${index}`}>{tip}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <CardDescription>Your weight progress over time.</CardDescription>
            </CardHeader>
            <CardContent>
              {weightChartData.length > 1 ? ( 
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={true} domain={['auto', 'auto']} />
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
                  {weightLog.length <=1 ? "Log at least two weight entries to see your trend graph." : "Log some weight entries to see your chart."}
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Weight Log History</CardTitle>
              <CardDescription>Review and manage your past weight entries, sorted by most recent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {weightLog.length > 0 ? (
                [...weightLog].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
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
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No weight entries yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

