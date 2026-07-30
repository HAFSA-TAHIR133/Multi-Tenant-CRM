import { useEffect, useState } from "react";
import { fetchApi } from "../../../api/fetchApiHelper";

export default function PipelineSelector({ value, onChange }) {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetchApi("/pipeline");
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!cancelled) setPipelines(list);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading pipelines…</div>;
  }

  return (
    <select
      className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">All Pipelines</option>
      {pipelines.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}