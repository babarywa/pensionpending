import { useGetStatsSummary, useGetRecentJobs, useListSubscriptions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Bell, ArrowRight, ShieldCheck } from "lucide-react";
import { JobCard } from "../components/job-card";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: recentJobs, isLoading: jobsLoading } = useGetRecentJobs();
  const { data: subscriptions, isLoading: subsLoading } = useListSubscriptions();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Welcome back. Here's what's happening in the public sector.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalJobs.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across all pension plans</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-primary">+{stats?.newThisWeek.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Fresh opportunities</p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Active Alerts</CardTitle>
            <Bell className="w-4 h-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <Skeleton className="h-8 w-12 bg-primary-foreground/20" />
            ) : (
              <div className="text-3xl font-bold">{subscriptions?.length || 0}</div>
            )}
            <Button asChild variant="link" className="text-primary-foreground h-auto p-0 mt-1 font-medium hover:text-white">
              <Link href="/subscriptions">Manage alerts &rarr;</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6 mt-12">
        <h2 className="text-2xl font-bold tracking-tight">Recent Opportunities</h2>
        <Button asChild variant="outline" className="hidden sm:flex">
          <Link href="/jobs">
            View all <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {jobsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-[280px]">
              <CardContent className="p-6 h-full flex flex-col">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <div className="flex gap-2 mb-6">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="mt-auto space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentJobs?.slice(0, 6).map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
      
      <div className="mt-8 text-center sm:hidden">
        <Button asChild variant="outline" className="w-full">
          <Link href="/jobs">
            View all jobs
          </Link>
        </Button>
      </div>
    </div>
  );
}