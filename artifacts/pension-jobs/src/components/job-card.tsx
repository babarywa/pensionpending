import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Building, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job } from "@workspace/api-client-react";

interface JobCardProps {
  job: Job;
  preview?: boolean;
}

export function JobCard({ job, preview = false }: JobCardProps) {
  const isNew = new Date(job.postedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all hover:-translate-y-0.5 group border-2 hover:border-primary/30" data-testid={`job-card-${job.id}`}>
      <CardContent className="p-6 flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-muted-foreground">
              <Building className="w-3.5 h-3.5" />
              <span className="font-medium text-sm text-foreground">{job.employer}</span>
            </div>
          </div>
          {isNew && (
            <Badge className="bg-primary text-primary-foreground whitespace-nowrap text-xs font-bold">
              NEW
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="bg-primary/8 text-primary border-primary/25 font-semibold text-xs">
            {job.pensionPlan}
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
            {job.category}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-auto pt-3 text-sm text-muted-foreground border-t border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="truncate text-xs">{job.location}, {job.province}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="truncate text-xs">
              {job.salaryText ||
                (job.salaryMin && job.salaryMax
                  ? `$${(job.salaryMin / 1000).toFixed(0)}k – $${(job.salaryMax / 1000).toFixed(0)}k`
                  : "Salary not specified")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="truncate text-xs">
              Posted {formatDistanceToNow(new Date(job.postedAt))} ago
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 mt-auto">
        <Button asChild className="w-full font-bold" variant={preview ? "outline" : "default"}>
          <Link href={preview ? "/sign-up" : `/jobs/${job.id}`}>
            {preview ? "Sign up to view details" : "View Job Details"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
