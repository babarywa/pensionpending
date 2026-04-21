import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { geocodeJob, isPointInPolygon, haversineDistance, type LatLng } from "@/lib/geocoding";
import type { Job } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hexagon, Circle, Trash2, Info } from "lucide-react";

function makeMarkerIcon(color: string, size = 14): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 10}" height="${size + 18}" viewBox="0 0 24 36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white" fill-opacity="0.85"/>
    </svg>`,
    iconSize: [size + 10, size + 18],
    iconAnchor: [(size + 10) / 2, size + 18],
    popupAnchor: [0, -(size + 18)],
  });
}

export type DrawMode = "none" | "polygon" | "circle";
export type SelectionState =
  | { type: "none" }
  | { type: "polygon"; points: LatLng[] }
  | { type: "circle"; center: LatLng; radius: number };

interface DrawControlProps {
  mode: DrawMode;
  clearTrigger: number;
  onSelectionChange: (sel: SelectionState) => void;
  onModeChange: (mode: DrawMode) => void;
}

function DrawControl({ mode, clearTrigger, onSelectionChange, onModeChange }: DrawControlProps) {
  const map = useMap();
  const drawLayerRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const handlerRef = useRef<any>(null);
  const prevClear = useRef(clearTrigger);

  useEffect(() => {
    const layer = drawLayerRef.current;
    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

  useEffect(() => {
    if (clearTrigger !== prevClear.current) {
      drawLayerRef.current.clearLayers();
      prevClear.current = clearTrigger;
    }
  }, [clearTrigger]);

  useEffect(() => {
    const handleCreated = (e: any) => {
      drawLayerRef.current.clearLayers();
      drawLayerRef.current.addLayer(e.layer);
      onModeChange("none");

      if (e.layerType === "polygon") {
        const latLngs: L.LatLng[] = e.layer.getLatLngs()[0];
        const points: LatLng[] = latLngs.map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }));
        onSelectionChange({ type: "polygon", points });
      } else if (e.layerType === "circle") {
        const center = e.layer.getLatLng();
        const radius: number = e.layer.getRadius();
        onSelectionChange({
          type: "circle",
          center: { lat: center.lat, lng: center.lng },
          radius,
        });
      }
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
    };
  }, [map, onSelectionChange, onModeChange]);

  useEffect(() => {
    if (handlerRef.current) {
      handlerRef.current.disable();
      handlerRef.current = null;
    }
    if (mode === "polygon") {
      handlerRef.current = new (L.Draw as any).Polygon(map, {
        shapeOptions: {
          color: "hsl(24,95%,50%)",
          weight: 2,
          fillColor: "hsl(24,95%,50%)",
          fillOpacity: 0.12,
        },
      });
      handlerRef.current.enable();
    } else if (mode === "circle") {
      handlerRef.current = new (L.Draw as any).Circle(map, {
        shapeOptions: {
          color: "hsl(24,95%,50%)",
          weight: 2,
          fillColor: "hsl(24,95%,50%)",
          fillOpacity: 0.12,
        },
      });
      handlerRef.current.enable();
    }
    return () => {
      if (handlerRef.current) {
        handlerRef.current.disable();
        handlerRef.current = null;
      }
    };
  }, [map, mode]);

  return null;
}

export interface GeocodedJob extends Job {
  coords: LatLng;
}

interface JobMapProps {
  jobs: Job[];
  selection: SelectionState;
  onSelectionChange: (sel: SelectionState) => void;
}

export function JobMap({ jobs, selection, onSelectionChange }: JobMapProps) {
  const [drawMode, setDrawMode] = useState<DrawMode>("none");
  const [clearTrigger, setClearTrigger] = useState(0);

  const geocodedJobs = useMemo<GeocodedJob[]>(
    () => jobs.map((job) => ({ ...job, coords: geocodeJob(job.location, job.province) })),
    [jobs]
  );

  const defaultIcon = useMemo(() => makeMarkerIcon("#2563eb"), []);
  const selectedIcon = useMemo(() => makeMarkerIcon("hsl(24,95%,50%)"), []);
  const dimIcon = useMemo(() => makeMarkerIcon("#94a3b8", 11), []);

  function isJobSelected(job: GeocodedJob): boolean {
    if (selection.type === "none") return true;
    if (selection.type === "polygon") return isPointInPolygon(job.coords, selection.points);
    if (selection.type === "circle")
      return haversineDistance(job.coords, selection.center) <= selection.radius;
    return true;
  }

  const hasSelection = selection.type !== "none";
  const selectedCount = geocodedJobs.filter(isJobSelected).length;

  function clearSelection() {
    onSelectionChange({ type: "none" });
    setDrawMode("none");
    setClearTrigger((c) => c + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground mr-1 hidden sm:inline">
          Draw Selection:
        </span>
        <Button
          size="sm"
          variant={drawMode === "polygon" ? "default" : "outline"}
          className="gap-1.5 font-semibold text-xs h-8"
          onClick={() => setDrawMode((p) => (p === "polygon" ? "none" : "polygon"))}
        >
          <Hexagon className="w-3.5 h-3.5" />
          Polygon
        </Button>
        <Button
          size="sm"
          variant={drawMode === "circle" ? "default" : "outline"}
          className="gap-1.5 font-semibold text-xs h-8"
          onClick={() => setDrawMode((p) => (p === "circle" ? "none" : "circle"))}
        >
          <Circle className="w-3.5 h-3.5" />
          Radius
        </Button>
        {hasSelection && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-destructive hover:text-destructive text-xs h-8"
            onClick={clearSelection}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {hasSelection ? (
            <Badge className="bg-primary text-primary-foreground font-bold">
              {selectedCount} job{selectedCount !== 1 ? "s" : ""} in area
            </Badge>
          ) : (
            <Badge variant="outline" className="font-medium">
              {geocodedJobs.length} job{geocodedJobs.length !== 1 ? "s" : ""} shown
            </Badge>
          )}
          {drawMode !== "none" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              <Info className="w-3 h-3 shrink-0" />
              {drawMode === "polygon"
                ? "Click to add points. Double-click to finish."
                : "Click map and drag to set radius."}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border-2 border-border shadow-sm" style={{ height: 440 }}>
        <MapContainer
          center={[56.1304, -106.3468]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DrawControl
            mode={drawMode}
            clearTrigger={clearTrigger}
            onSelectionChange={(sel) => {
              onSelectionChange(sel);
              setDrawMode("none");
            }}
            onModeChange={setDrawMode}
          />
          {geocodedJobs.map((job) => {
            const selected = isJobSelected(job);
            const icon = hasSelection
              ? selected
                ? selectedIcon
                : dimIcon
              : defaultIcon;
            return (
              <Marker
                key={job.id}
                position={[job.coords.lat, job.coords.lng]}
                icon={icon}
                opacity={hasSelection && !selected ? 0.3 : 1}
              >
                <Popup maxWidth={260}>
                  <div className="space-y-1 py-0.5">
                    <p className="font-bold text-sm leading-tight">{job.title}</p>
                    <p className="text-xs text-gray-600">{job.employer}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-1.5 py-0.5 rounded">
                        {job.pensionPlan}
                      </span>
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
                        {job.location}, {job.province}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
