"use client";
import maplibregl, { Map as M } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { IncidentResp, RoadsResp } from "@/types";

type Props = { filter: string };

export default function MapView({ filter }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<M | null>(null);

  const style = process.env.NEXT_PUBLIC_MAP_STYLE;
  const mapStyle = useMemo(() => {
    if (style === "maptiler") {
      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      return `https://api.maptiler.com/maps/streets/style.json?key=${key}`;
    }
    // Fallback: simple OSM raster tiles style
    return {
      version: 8,
      sources: {
        "osm-raster": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors"
        }
      },
      layers: [{ id:"osm", type:"raster", source:"osm-raster" }]
    } as any;
  }, [style]);

  const { data: incidents } = useSWR<IncidentResp>("incidents", () => api.incidents(), { refreshInterval: 120000 });
  const { data: roads } = useSWR<RoadsResp>("roads", () => api.roads(), { refreshInterval: 120000 });

  const [ready, setReady] = useState(false);

  // Init map
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: mapStyle,
      center: [-121.5, 37.5], // NorCal center
      zoom: 5.1
    });
    map.addControl(new maplibregl.NavigationControl({ showZoom: true }));
    map.on("load", () => setReady(true));
    mapRef.current = map;
    return () => map.remove();
  }, [mapStyle]);

  // Render data as simple layers (no clustering for MVP)
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    // Clean previous layers/sources on refresh
    const cleanup = () => {
      ["inc-src","inc-lyr","rd-src","rd-lyr"].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      });
    };
    cleanup();

    // Filter function
    const f = (s: string) => (x: string) => !s || x.toLowerCase().includes(s.toLowerCase());

    // Incidents as circles
    const inc = (incidents?.incidents || []).filter(i =>
      f(filter)(i.road || "") || f(filter)(i.description || "") || f(filter)(i.type)
    ).filter(i => typeof i.lat === "number" && typeof i.lng === "number");

    map.addSource("inc-src", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: inc.map(i => ({
          type: "Feature",
          properties: {
            id: i.id, type: i.type, severity: i.severity, desc: i.description, src: i.source, road: i.road
          },
          geometry: { type: "Point", coordinates: [i.lng!, i.lat!] }
        }))
      }
    } as any);

    map.addLayer({
      id: "inc-lyr",
      source: "inc-src",
      type: "circle",
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "match", ["get","severity"],
          "major", "#e10600",
          "moderate", "#f28f3b",
          "minor", "#f1c40f",
          /* other */ "#3b82f6"
        ],
        "circle-stroke-color": "#000",
        "circle-stroke-width": 0.6
      }
    });

    // Roads as line strings (we only have points in MVP; draw same points with different styling if closure/chain)
    const rd = (roads?.roads || []).filter(r =>
      f(filter)(r.status || "") || f(filter)(r.restriction || "") || f(filter)(r.chainControl || "")
    ).filter(r => typeof r.lat === "number" && typeof r.lng === "number");

    map.addSource("rd-src", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: rd.map(r => ({
          type: "Feature",
          properties: { status: r.status, chain: r.chainControl, src: r.source },
          geometry: { type: "Point", coordinates: [r.lng!, r.lat!] }
        }))
      }
    } as any);

    map.addLayer({
      id: "rd-lyr",
      source: "rd-src",
      type: "circle",
      paint: {
        "circle-radius": 5,
        "circle-color": [
          "match", ["get","status"],
          "closed", "#ff4d4f",
          "restricted", "#8b5cf6",
          /* other */ "#10b981"
        ],
        "circle-stroke-color": "#111",
        "circle-stroke-width": 0.5
      }
    });

    // Popups
    const h = (e: maplibregl.MapLayerMouseEvent, kind: "inc" | "rd") => {
      const feature = e.features?.[0];
      if (!feature) return;
      const coords = (feature.geometry as any).coordinates.slice();
      const p = feature.properties || {};
      const html = kind === "inc"
        ? `<strong>${p.type || "Incident"}</strong><br/>${p.desc || ""}<br/><em>${p.road || ""}</em><br/><small>src: ${p.src}</small>`
        : `<strong>${p.status || "Condition"}</strong><br/>chain: ${p.chain || "-"}<br/><small>src: ${p.src}</small>`;
      new maplibregl.Popup({ closeOnClick: true }).setLngLat(coords).setHTML(html).addTo(map);
    };

    map.on("click","inc-lyr",(e)=>h(e,"inc"));
    map.on("click","rd-lyr",(e)=>h(e,"rd"));

    return cleanup;
  }, [ready, incidents, roads, filter]);

  return <div className="map-wrap" ref={container} />;
}
