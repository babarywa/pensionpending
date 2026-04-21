import { useEffect } from "react";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  jobAlertEmail: z.string().email("Please enter a valid email address").or(z.literal("")),
});

type FormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: clerkUser } = useUser();

  const { data: profile, isLoading } = useGetMe();
  const updateMe = useUpdateMe();

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      jobAlertEmail: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        jobAlertEmail: profile.jobAlertEmail || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: FormValues) => {
    updateMe.mutate({
      data: {
        displayName: data.displayName || null,
        jobAlertEmail: data.jobAlertEmail || null,
      }
    }, {
      onSuccess: (updatedData) => {
        queryClient.setQueryData(getGetMeQueryKey(), updatedData);
        toast({
          title: "Profile updated",
          description: "Your profile has been saved successfully.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "There was a problem updating your profile. Please try again.",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and alert settings.</p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your basic account information. Account email is managed by your sign-in provider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Account Email</Label>
                      <Input 
                        disabled 
                        value={profile?.email || clerkUser?.primaryEmailAddress?.emailAddress || ""} 
                        className="bg-muted" 
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        This is your primary login email.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobAlertEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Delivery address for alerts" type="email" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank to receive alerts at your account email address.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={updateMe.isPending}>
                    {updateMe.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}