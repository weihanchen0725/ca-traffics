import type { IncidentResp, RoadsResp, MetaResp } from "../../types";

type Env = {
  INCIDENTS_FEED_URL?: string;
  ROADS_FEED_URL?: string;
  META_FEED_URL?: string;
  CORS_ALLOW_ORIGIN?: string;
  API_CACHE_SECONDS?: string;
};

const ORIGIN_WILDCARD = "*";
const START_TIME = Date.now();

const fallbackIncidents: IncidentResp = {
  ok: true,
  meta: { source: "stub", generatedAt: new Date().toISOString() },
  incidents: [
    {
      id: "demo-incident-1",
      type: "Accident",
      severity: "major",
      lat: 37.7913,
      lng: -122.401,
      startTime: new Date(Date.now() - 15 * 60_000).toISOString(),
      updatedAt: new Date().toISOString(),
      description: "Multi-vehicle collision reported near downtown.",
      road: "US-101",
      direction: "NB",
      lanesClosed: "2",
      source: "stub",
      raw: null,
    },
    {
      id: "demo-incident-2",
      type: "Disabled Vehicle",
      severity: "moderate",
      lat: 34.0736,
      lng: -118.3997,
      startTime: new Date(Date.now() - 35 * 60_000).toISOString(),
      updatedAt: new Date().toISOString(),
      description: "Stalled vehicle blocking shoulder.",
      road: "I-405",
      direction: "SB",
      lanesClosed: "Shoulder",
      source: "stub",
      raw: null,
    },
  ],
};

const fallbackRoads: RoadsResp = {
  ok: true,
  meta: { source: "stub", generatedAt: new Date().toISOString() },
  roads: [
    {
      segmentId: "demo-road-1",
      status: "restricted",
      restriction: "Accident cleanup",
      chainControl: "None",
      lat: 39.1911,
      lng: -120.1938,
      startTime: new Date(Date.now() - 45 * 60_000).toISOString(),
      updatedAt: new Date().toISOString(),
      source: "stub",
      raw: null,
    },
    {
      segmentId: "demo-road-2",
      status: "closed",
      restriction: "Heavy snow",
      chainControl: "R3",
      lat: 38.8301,
      lng: -120.0448,
      startTime: new Date(Date.now() - 120 * 60_000).toISOString(),
      updatedAt: new Date().toISOString(),
      source: "stub",
      raw: null,
    },
  ],
};

const fallbackMeta: MetaResp = {
  sources: [
    { id: "stub", label: "Demo Data", description: "Replace with Caltrans feeds." },
  ],
  lastFetch: {
    incidents: new Date().toISOString(),
    roads: new Date().toISOString(),
  },
};

const isIncidentResp = (value: unknown): value is IncidentResp =>
  !!value && typeof value === "object" && Array.isArray((value as IncidentResp).incidents);

const isRoadsResp = (value: unknown): value is RoadsResp =>
  !!value && typeof value === "object" && Array.isArray((value as RoadsResp).roads);

const isMetaResp = (value: unknown): value is MetaResp =>
  !!value &&
  typeof value === "object" &&
  "sources" in (value as MetaResp) &&
  Array.isArray((value as MetaResp).sources);

const cacheSeconds = (env: Env) => {
  const asNumber = Number(env.API_CACHE_SECONDS);
  return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : 60;
};

const corsHeaders = (env: Env) => ({
  "Access-Control-Allow-Origin": env.CORS_ALLOW_ORIGIN || ORIGIN_WILDCARD,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
});

const makeJSON = (env: Env, data: unknown, status = 200): Response => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": `public, max-age=${cacheSeconds(env)}`,
    ...corsHeaders(env),
  };
  return new Response(JSON.stringify(data), { status, headers });
};

const handleOptions = (env: Env): Response =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Origin": env.CORS_ALLOW_ORIGIN || ORIGIN_WILDCARD,
    },
  });

async function fetchUpstream<T>(envValue: string | undefined): Promise<T | null> {
  if (!envValue) return null;
  const response = await fetch(envValue, {
    cf: { cacheTtl: 30, cacheEverything: true },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${envValue} responded with ${response.status}`);
  }
  return (await response.json()) as T;
}

async function loadIncidents(env: Env): Promise<IncidentResp> {
  try {
    const upstream = await fetchUpstream<unknown>(env.INCIDENTS_FEED_URL);
    if (isIncidentResp(upstream)) {
      return { ...upstream, ok: upstream.ok ?? true };
    }
  } catch (error) {
    console.error("incident feed error:", error);
  }
  return fallbackIncidents;
}

async function loadRoads(env: Env): Promise<RoadsResp> {
  try {
    const upstream = await fetchUpstream<unknown>(env.ROADS_FEED_URL);
    if (isRoadsResp(upstream)) {
      return { ...upstream, ok: upstream.ok ?? true };
    }
  } catch (error) {
    console.error("roads feed error:", error);
  }
  return fallbackRoads;
}

async function loadMeta(env: Env): Promise<MetaResp> {
  try {
    const upstream = await fetchUpstream<unknown>(env.META_FEED_URL);
    if (isMetaResp(upstream)) {
      return upstream;
    }
  } catch (error) {
    console.error("meta feed error:", error);
  }
  return fallbackMeta;
}

async function router(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return handleOptions(env);
  if (request.method !== "GET") {
    return makeJSON(env, { ok: false, error: "Method not allowed" }, 405);
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/health") {
    return makeJSON(env, {
      ok: true,
      uptime: Math.round((Date.now() - START_TIME) / 1000),
      cacheTtl: cacheSeconds(env),
    });
  }

  if (pathname === "/v1/traffic/incidents") {
    const data = await loadIncidents(env);
    return makeJSON(env, data);
  }

  if (pathname === "/v1/traffic/roads") {
    const data = await loadRoads(env);
    return makeJSON(env, data);
  }

  if (pathname === "/v1/meta/sources") {
    const data = await loadMeta(env);
    return makeJSON(env, data);
  }

  return makeJSON(env, { ok: false, error: "Not found" }, 404);
}

export default { fetch: router };
