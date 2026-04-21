import { useState } from "react";
import { 
  useListSubscriptions, 
  useCreateSubscription, 
  useDeleteSubscription,
  useGetStatsByPension,
  useGetStatsByCategory,
  getListSubscriptionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Trash2, Mail, Plus, AlertCircle } from "lucide-react";

const subscriptionSchema = z.object({
  pensionPlan: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  keyword: z.string().optional(),
  emailFrequency: z.enum(["daily", "weekly", "instant"]),
}).refine(data => data.pensionPlan || data.category || data.location || data.keyword, {
  message: "At least one filter must be provided",
  path: ["pensionPlan"], // Error will show up near this field
});

type FormValues = z.infer<typeof subscriptionSchema>;

export default function Subscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: subscriptions, isLoading: subsLoading } = useListSubscriptions();
  const { data: pensionStats } = useGetStatsByPension();
  const { data: categoryStats } = useGetStatsByCategory();

  const createSub = useCreateSubscription();
  const deleteSub = useDeleteSubscription();

  const form = useForm<FormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      pensionPlan: "",
      category: "",
      location: "",
      keyword: "",
      emailFrequency: "daily",
    },
  });

  const onSubmit = (data: FormValues) => {
    // Clean up empty strings to undefined for API
    const payload = {
      pensionPlan: data.pensionPlan || undefined,
      category: data.category || undefined,
      location: data.location || undefined,
      keyword: data.keyword || undefined,
      emailFrequency: data.emailFrequency,
    };

    createSub.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        toast({
          title: "Alert created",
          description: "You'll start receiving email notifications for matching jobs.",
        });
        form.reset();
        setIsCreating(false);
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Failed to create alert",
          description: "Please try again later.",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteSub.mutate({ subscriptionId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        toast({
          title: "Alert deleted",
          description: "You will no longer receive emails for this alert.",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Alerts</h1>
          <p className="text-muted-foreground mt-1">Get notified when relevant pension-backed jobs are posted.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Create Alert</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-10 border-primary shadow-sm bg-primary/5">
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>We'll email you when new jobs match your criteria.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {form.formState.errors.pensionPlan && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.pensionPlan.message}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="keyword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Director, Analyst, IT..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pensionPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pension Plan (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any Plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any Plan</SelectItem>
                            {pensionStats?.map(s => (
                              <SelectItem key={s.pensionPlan} value={s.pensionPlan}>{s.pensionPlan}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any Category</SelectItem>
                            {categoryStats?.map(s => (
                              <SelectItem key={s.category} value={s.category}>{s.category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any Location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any Location</SelectItem>
                            <SelectItem value="ON">Ontario</SelectItem>
                            <SelectItem value="BC">British Columbia</SelectItem>
                            <SelectItem value="AB">Alberta</SelectItem>
                            <SelectItem value="QC">Quebec</SelectItem>
                            <SelectItem value="MB">Manitoba</SelectItem>
                            <SelectItem value="SK">Saskatchewan</SelectItem>
                            <SelectItem value="NS">Nova Scotia</SelectItem>
                            <SelectItem value="NB">New Brunswick</SelectItem>
                            <SelectItem value="PE">Prince Edward Island</SelectItem>
                            <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emailFrequency"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily Digest (Recommended)</SelectItem>
                            <SelectItem value="weekly">Weekly Digest</SelectItem>
                            <SelectItem value="instant">Instant (As soon as posted)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          We'll group your alerts into a single email where possible.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSub.isPending}>
                    {createSub.isPending ? "Creating..." : "Save Alert"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-bold mb-4">Your Active Alerts</h2>
      
      {subsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : subscriptions?.length === 0 ? (
        <Card className="bg-muted/30 border-dashed text-center py-12">
          <CardContent>
            <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No alerts set up</h3>
            <p className="text-muted-foreground mb-6">Create an alert to get notified about jobs you care about.</p>
            <Button onClick={() => setIsCreating(true)} variant="outline">Create your first alert</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions?.map(sub => (
            <Card key={sub.id}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {sub.emailFrequency.charAt(0).toUpperCase() + sub.emailFrequency.slice(1)} Alert
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive -mt-2 -mr-2"
                  onClick={() => handleDelete(sub.id)}
                  disabled={deleteSub.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2 text-sm">
                  {sub.keyword && (
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-muted-foreground">Keyword:</span>
                      <span className="font-medium truncate">{sub.keyword}</span>
                    </div>
                  )}
                  {sub.pensionPlan && (
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-muted-foreground">Pension:</span>
                      <span className="font-medium truncate">{sub.pensionPlan}</span>
                    </div>
                  )}
                  {sub.category && (
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium truncate">{sub.category}</span>
                    </div>
                  )}
                  {sub.location && (
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium truncate">{sub.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}