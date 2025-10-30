"use client";
import { useState } from "react";
import MapView from "@/components/MapView";
import Panel from "@/components/Panel";
import { Legend } from "@/components/Legend";

export default function Page() {
  const [filter, setFilter] = useState("");
  return (
    <main>
      <Panel onFilter={setFilter} />
      <Legend />
      <MapView filter={filter} />
    </main>
  );
}
