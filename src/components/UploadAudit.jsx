import { useState } from "react";

export default function UploadAudit({ majorId, onApply }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (majorId) form.append("majorId", majorId);
      const res = await fetch("/api/audit/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applySets = () => {
    if (!result?.summary) return;
    onApply?.(new Set(result.summary.completedCourses), new Set(result.summary.inProgressCourses));
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold">Import Degree Audit (PDF)</h3>
      <p className="text-xs text-gray-600">Upload your official audit PDF and we will auto-detect completed and in-progress courses.</p>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="text-xs"
      />
      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-3 py-1.5 rounded-lg border text-xs font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "Parsing..." : "Parse Audit"}
        </button>
        {result?.summary && (
          <button
            onClick={applySets}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium bg-black text-white hover:bg-gray-800"
          >
            Apply to Planner
          </button>
        )}
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      {result && (
        <div className="text-xs space-y-2 mt-2">
          <div>
            <span className="font-medium">Completed:</span> {result.summary?.completedCourses?.length || 0}
          </div>
          <div>
            <span className="font-medium">In Progress:</span> {result.summary?.inProgressCourses?.length || 0}
          </div>
          <div>
            <span className="font-medium">Remaining Required:</span> {result.summary?.remainingRequired?.length || 0}
          </div>
          <div>
            <span className="font-medium">Remaining Electives:</span> {result.summary?.remainingElectives?.length || 0}
          </div>
          {result.summary?.unmatched?.length > 0 && (
            <div className="text-yellow-700">Unmatched: {result.summary.unmatched.length}</div>
          )}
        </div>
      )}
    </div>
  );
}
