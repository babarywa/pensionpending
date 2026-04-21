import { useParams, Link } from "wouter";
import { useGetJob } from "@workspace/api-client-react";
import { getGetJobQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Building2, MapPin, DollarSign, Calendar, ExternalLink, ShieldCheck, Clock } from "lucide-react";

export default function JobDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: job, isLoading } = useGetJob(id, {
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id) }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6 -ml-4" disabled>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to jobs
        </Button>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-6" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold mb-2">Job not found</h1>
        <p className="text-muted-foreground mb-8">This job listing may have been removed or is no longer available.</p>
        <Button asChild>
          <Link href="/jobs">Browse all jobs</Link>
        </Button>
      </div>
    );
  }

  const salaryDisplay = job.salaryText || 
    (job.salaryMin && job.salaryMax 
      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()} / year` 
      : "Salary not specified");

  const isClosed = job.closingDate && new Date(job.closingDate) < new Date();

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <Link href="/jobs">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to search
            </Link>
          </Button>

          <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-sm px-3 py-1">
                  {job.pensionPlan} Plan
                </Badge>
                {job.category && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {job.category}
                  </Badge>
                )}
                {!job.isActive && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    Closed
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-2">
                {job.title}
              </h1>
              <div className="text-xl text-muted-foreground">
                {job.employer}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0">
              <Button size="lg" className="w-full lg:w-48 text-base shadow-sm" asChild disabled={!job.isActive || isClosed}>
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                  Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              {isClosed ? (
                <p className="text-sm text-destructive text-center font-medium">Application deadline passed</p>
              ) : job.closingDate ? (
                <p className="text-sm text-muted-foreground text-center">
                  Closes {format(new Date(job.closingDate), "MMM d, yyyy")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Employer</p>
                <p className="font-semibold leading-tight">{job.employer}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                <p className="font-semibold leading-tight">{job.location}, {job.province}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4 flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Compensation</p>
                <p className="font-semibold leading-tight">{salaryDisplay}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Posted</p>
                <p className="font-semibold leading-tight">{format(new Date(job.postedAt), "MMM d, yyyy")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card border rounded-xl p-6 md:p-8 lg:p-10 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight mb-6">About the Role</h2>
          <div className="prose prose-blue max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }} />
          
          <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-muted-foreground mb-1">Ready to start your application?</p>
              <p className="text-sm font-medium">You will be redirected to the employer's career portal.</p>
            </div>
            <Button size="lg" className="w-full sm:w-auto min-w-[200px]" asChild disabled={!job.isActive || isClosed}>
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                Apply for this job <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}