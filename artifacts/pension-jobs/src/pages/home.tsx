import { useListJobs, useGetStatsSummary, useGetStatsByPension } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, ShieldCheck, ArrowRight, TrendingUp, Zap } from "lucide-react";
import { JobCard } from "../components/job-card";
import { useEffect, useRef, useState } from "react";

const TOTAL_PENSION_EMPLOYERS = 1247;
const INDEXED_EMPLOYERS = 912;
const COVERAGE_PCT = Math.round((INDEXED_EMPLOYERS / TOTAL_PENSION_EMPLOYERS) * 100);

function CoverageBar() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-10 max-w-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-white/60 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary" />
          Pension Employer Coverage
        </span>
        <span className="text-xs font-bold text-primary tabular-nums">{COVERAGE_PCT}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-[1600ms] ease-out"
          style={{
            width: visible ? `${COVERAGE_PCT}%` : "0%",
            transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
      <p className="mt-2 text-xs text-white/50">
        {INDEXED_EMPLOYERS.toLocaleString()} of {TOTAL_PENSION_EMPLOYERS.toLocaleString()} major Canadian public sector employers indexed
      </p>
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: pensionStats, isLoading: pensionLoading } = useGetStatsByPension();
  const { data: jobsData, isLoading: jobsLoading } = useListJobs({ limit: 6, preview: true });

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden pb-24 pt-20 lg:pt-28 noise-overlay"
        style={{ background: "hsl(222, 47%, 12%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl" style={{ background: "hsl(24,95%,50%)" }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 mb-6 border border-primary/30 backdrop-blur-sm px-3 py-1 text-xs font-bold tracking-widest uppercase">
              Canada's Public Pension Job Board
            </Badge>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1] text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Your pension-backed<br />
              career is <span className="text-primary">pending.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              The only job board built exclusively for Canadian public sector roles with defined benefit pension plans.
              No noise. No fluff. Just careers that build real retirement security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-base h-12 px-8 font-bold shadow-lg shadow-primary/25">
                <Link href="/sign-up">Create Free Account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/10 text-base h-12 px-8 bg-transparent text-white hover:text-white hover:border-white/40"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>

            <CoverageBar />
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-14 md:h-20"
          style={{
            background: "hsl(220, 30%, 97%)",
            clipPath: "polygon(0 100%, 100% 100%, 100% 0)",
          }}
        />
      </section>

      {/* Stats Strip */}
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
            <StatItem
              icon={Briefcase}
              value={statsLoading ? null : stats?.totalJobs.toLocaleString()}
              label="Active Jobs"
            />
            <StatItem
              icon={Building2}
              value={statsLoading ? null : stats?.totalEmployers.toLocaleString()}
              label="Employers"
            />
            <StatItem
              icon={ShieldCheck}
              value={statsLoading ? null : stats?.pensionPlans.toLocaleString()}
              label="Pension Plans"
            />
            <StatItem
              icon={TrendingUp}
              value={statsLoading ? null : stats?.newThisWeek.toLocaleString()}
              label="New This Week"
              highlight
            />
          </div>
        </div>
      </section>

      {/* Recent Jobs Preview */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-14 md:h-20"
          style={{
            background: "hsl(220, 30%, 97%)",
            clipPath: "polygon(0 0, 0 100%, 100% 0)",
          }}
        />
        <div className="container mx-auto px-4 mt-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-2">Fresh Listings</p>
              <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Latest Opportunities
              </h2>
              <p className="text-muted-foreground text-base">Recently posted roles across Canada. Pension included.</p>
            </div>
            <Button asChild variant="outline" className="shrink-0 group font-semibold border-2">
              <Link href="/sign-up" className="flex items-center">
                View all jobs
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {jobsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
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
              {jobsData?.jobs.map((job) => (
                <JobCard key={job.id} job={job} preview={true} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="px-8 h-12 text-base shadow-sm font-bold shadow-primary/20">
              <Link href="/sign-up">
                Sign up to view {stats?.totalJobs ? `${stats.totalJobs - 6}+ more jobs` : "all jobs"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pension Plans Section */}
      <section className="py-20 bg-background border-t relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Supported Plans</p>
            <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Every Major Pension. One Place.
            </h2>
            <p className="text-base text-muted-foreground">
              We aggregate jobs across all major Canadian public sector defined benefit plans.
              A secure retirement starts with the right employer.
            </p>
          </div>

          {pensionLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pensionStats?.map((stat) => (
                <Card
                  key={stat.pensionPlan}
                  className="hover:border-primary/40 transition-all hover:shadow-md hover:-translate-y-0.5 group bg-card"
                >
                  <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary mb-2 group-hover:scale-125 transition-transform" />
                    <span className="font-bold text-base text-foreground leading-tight">{stat.pensionPlan}</span>
                    <span className="text-xs font-medium text-muted-foreground">{stat.count} active jobs</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-14 md:h-20"
          style={{
            background: "hsl(222, 47%, 12%)",
            clipPath: "polygon(0 100%, 100% 100%, 100% 0)",
          }}
        />
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" style={{ background: "hsl(222, 47%, 12%)" }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Stop waiting. Start pending — wisely.
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of Canadians finding pension-backed public sector careers in one place.
          </p>
          <Button asChild size="lg" className="px-10 h-13 text-base font-bold shadow-xl shadow-primary/30">
            <Link href="/sign-up">Get Started — It's Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
  highlight = false,
}: {
  icon: any;
  value: string | null | undefined;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 text-center ${highlight ? "text-primary" : "text-foreground"}`}>
      <Icon className={`w-7 h-7 mb-3 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      {value === null || value === undefined ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <span className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {value}
        </span>
      )}
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}
