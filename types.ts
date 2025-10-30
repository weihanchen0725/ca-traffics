export type Incident = {
  id: string; type: string; severity: string;
  lat?: number; lng?: number;
  startTime: string; updatedAt: string;
  description: string; road: string; direction: string;
  lanesClosed: string; source: string; raw: unknown;
};

export type RoadCondition = {
  segmentId?: string; status: string; restriction?: string; chainControl?: string;
  lat?: number; lng?: number; startTime?: string; updatedAt?: string;
  source: string; raw: unknown;
};

export type IncidentResp = { ok: boolean; incidents: Incident[]; meta: any; };
export type RoadsResp = { ok: boolean; roads: RoadCondition[]; meta: any; };
export type MetaResp = { sources: any[]; lastFetch: { incidents: string|null; roads: string|null } };
