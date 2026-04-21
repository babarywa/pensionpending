import { useState, useEffect, useMemo } from "react";
import { useListJobs, useGetStatsByPension, useGetStatsByCategory } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "../components/job-card";
import { JobMap, type SelectionState } from "../components/job-map";
import { isPointInPolygon, haversineDistance, geocodeJob } from "@/lib/geocoding";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, Briefcase, Map, List } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";

export default function Jobs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mapMode, setMapMode] = useState(false);
  const [mapSelection, setMapSelection] = useState<SelectionState>({ type: "none" });

  const [filters, setFilters] = useState({
    pension: "all",
    category: "all",
    location: "all",
  });

  const { data: pensionStats } = useGetStatsByPension();
  const { data: categoryStats } = useGetStatsByCategory();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  useEffect(() => {
    if (!mapMode) setMapSelection({ type: "none" });
  }, [mapMode]);

  const sharedQueryParams = {
    search: debouncedSearch || undefined,
    pension: filters.pension !== "all" ? filters.pension : undefined,
    category: filters.category !== "all" ? filters.category : undefined,
    location: filters.location !== "all" ? filters.location : undefined,
  };

  const { data, isLoading } = useListJobs({
    page,
    limit: 12,
    ...sharedQueryParams,
  });

  const { data: mapData, isLoading: mapLoading } = useListJobs(
    { limit: 500, ...sharedQueryParams },
    { query: { enabled: mapMode } }
  );

  const mapFilteredJobs = useMemo(() => {
    if (!mapData?.jobs) return [];
    if (mapSelection.type === "none") return mapData.jobs;
    return mapData.jobs.filter((job) => {
      const coords = geocodeJob(job.location, job.province);
      if (mapSelection.type === "polygon") return isPointInPolygon(coords, mapSelection.points);
      if (mapSelection.type === "circle")
        return haversineDistance(coords, mapSelection.center) <= mapSelection.radius;
      return true;
    });
  }, [mapData?.jobs, mapSelection]);

  const activeFiltersCount =
    Object.values(filters).filter((v) => v !== "all").length + (debouncedSearch ? 1 : 0);

  const clearFilters = () => {
    setFilters({ pension: "all", category: "all", location: "all" });
    setSearch("");
    setDebouncedSearch("");
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Search Keywords</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Job title, keywords, employer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pension Plan</Label>
        <Select
          value={filters.pension}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, pension: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {pensionStats?.filter((stat) => stat.pensionPlan?.trim()).map((stat) => (
              <SelectItem key={stat.pensionPlan} value={stat.pensionPlan}>
                {stat.pensionPlan} ({stat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Job Category</Label>
        <Select
          value={filters.category}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, category: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryStats?.filter((stat) => stat.category?.trim()).map((stat) => (
              <SelectItem key={stat.category} value={stat.category}>
                {stat.category} ({stat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Province</Label>
        <Select
          value={filters.location}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, location: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
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
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-muted-foreground">
          <X className="w-4 h-4 mr-2" /> Clear all filters
        </Button>
      )}
    </div>
  );

  const listJobsToShow = mapMode && mapSelection.type !== "none" ? mapFilteredJobs : data?.jobs ?? [];
  const listTotal = mapMode && mapSelection.type !== "none" ? mapFilteredJobs.length : data?.total ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block border-r pr-8">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Filters</h2>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="px-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Job Board
              </h1>
              <p className="text-muted-foreground mt-1">
                {isLoading && !mapMode
                  ? "Loading..."
                  : mapMode && mapSelection.type !== "none"
                  ? `${mapFilteredJobs.length} jobs in selected area`
                  : `${data?.total ?? 0} jobs found`}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant={mapMode ? "default" : "outline"}
                size="sm"
                className="gap-2 font-semibold"
                onClick={() => setMapMode((m) => !m)}
              >
                {mapMode ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                {mapMode ? "List View" : "Map Search"}
              </Button>

              <div className="md:hidden flex-1">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader className="mb-6">
                      <SheetTitle>Filter Jobs</SheetTitle>
                    </SheetHeader>
                    <FilterContent />
                    <SheetFooter className="mt-8">
                      <SheetClose asChild>
                        <Button className="w-full">Apply Filters</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          <div className="mb-6 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Map Section */}
          {mapMode && (
            <div className="mb-8">
              {mapLoading ? (
                <div className="rounded-lg border-2 border-border bg-muted/30 flex items-center justify-center" style={{ height: 440 }}>
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading job locations…</span>
                  </div>
                </div>
              ) : (
                <JobMap
                  jobs={mapData?.jobs ?? []}
                  selection={mapSelection}
                  onSelectionChange={setMapSelection}
                />
              )}
              {mapSelection.type !== "none" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing jobs within your selected area. Draw a new shape to change the selection, or click Clear to reset.
                </p>
              )}
            </div>
          )}

          {/* Job List */}
          {mapMode ? (
            /* Map mode job list */
            mapLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
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
            ) : listJobsToShow.length === 0 ? (
              <Card className="bg-muted/50 border-dashed text-center py-16">
                <CardContent>
                  <Map className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs in this area</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {mapSelection.type !== "none"
                      ? "No jobs found within the selected area. Try expanding or moving your selection."
                      : "No jobs match your current filters."}
                  </p>
                  {mapSelection.type !== "none" && (
                    <Button onClick={() => setMapSelection({ type: "none" })} variant="outline">
                      Clear Map Selection
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-medium">
                  {mapSelection.type !== "none" ? "Jobs in selected area" : "All matching jobs"} — {listJobsToShow.length} result{listJobsToShow.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {listJobsToShow.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            )
          ) : /* List mode */
          isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          ) : data?.jobs.length === 0 ? (
            <Card className="bg-muted/50 border-dashed text-center py-16">
              <CardContent>
                <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  We couldn't find any jobs matching your filters. Try adjusting your search or clearing some filters.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data?.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {data && data.total > 0 && (
                <div className="flex items-center justify-between border-t pt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {(page - 1) * data.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-foreground">
                      {Math.min(page * data.limit, data.total)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">{data.total}</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.hasMore}
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
