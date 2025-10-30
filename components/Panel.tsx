"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import { fmtAgo } from "@/lib/format";
import type { IncidentResp, RoadsResp, MetaResp } from "@/types";

export default function Panel({ onFilter }: { onFilter: (q: string) => void }) {
  const { data: meta } = useSWR<MetaResp>("meta", () => api.meta());
  const { data: incidents } = useSWR<IncidentResp>("incidents", () => api.incidents(), { refreshInterval: 120000 });
  const { data: roads } = useSWR<RoadsResp>("roads", () => api.roads(), { refreshInterval: 120000 });

  const total = (incidents?.incidents?.length || 0) + (roads?.roads?.length || 0);

  return (
    <div className="panel">
      <h3 style={{ margin: 0 }}>CA Traffic</h3>
      <div style={{ color: "#666", marginBottom: 8 }}>
        Updated: <span className="badge">incidents {fmtAgo(meta?.lastFetch?.incidents)}</span>
        <span className="badge">roads {fmtAgo(meta?.lastFetch?.roads)}</span>
      </div>

      <label style={{ display: "block", marginBottom: 6 }}>
        Filter (road/search):
        <input onChange={(e)=>onFilter(e.target.value)} placeholder="e.g. I-80, closure" style={{ width: "100%", padding: 8 }} />
      </label>

      <div style={{ fontSize: 14, marginBottom: 6 }}>
        <strong>{total}</strong> items • <a href={`${process.env.NEXT_PUBLIC_API_BASE}/openapi.json`} target="_blank">OpenAPI</a>
      </div>

      <details>
        <summary>Sources</summary>
        <ul style={{ paddingLeft: 16 }}>
          {meta?.sources?.map(s => (
            <li key={s.id}><strong>{s.id}</strong> — <a href={s.terms_url} target="_blank">{s.base_url || s.terms_url}</a></li>
          ))}
        </ul>
      </details>
    </div>
  );
}
