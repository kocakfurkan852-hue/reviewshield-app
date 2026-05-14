"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

import { importReviews } from "@/app/actions/review";

export function ReviewImporter({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success?: boolean, count?: number, error?: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult({});

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: async (results) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rows = results.data as any[];
          
          // Map to required format. Expected CSV columns: reviewer_name, review_text, star_rating, review_url
          const reviews = rows.map(row => ({
            reviewer_name: row.reviewer_name || row.Name || row.Author || "Unknown",
            review_text: row.review_text || row.Text || row.Review || "",
            star_rating: parseInt(row.star_rating || row.Rating || row.Stars) || 1,
            review_url: row.review_url || row.URL || row.Link,
          })).filter(r => r.review_url); // URL is strictly required by schema

          if (reviews.length === 0) {
            setResult({ error: "No valid reviews found. Please ensure your CSV has a 'review_url' column." });
            setLoading(false);
            return;
          }

          const res = await importReviews(campaignId, reviews);
          setResult({ success: true, count: res.count });
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setResult({ error: (err as any).message || "Failed to import reviews." });
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        setResult({ error: `CSV Parsing error: ${error.message}` });
        setLoading(false);
      }
    });
  };

  return (
    <div className="vault-card p-6 rounded-md">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Import Reviews (CSV)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a CSV file containing the reviews to delete. Required columns: <code>review_url</code>, <code>star_rating</code>. 
        Optional: <code>reviewer_name</code>, <code>review_text</code>.
      </p>
      
      <div className="flex items-center gap-4">
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={loading}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {loading && <span className="text-sm font-medium animate-pulse text-primary">Importing...</span>}
      </div>
      
      {result.error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
          {result.error}
        </div>
      )}
      
      {result.success && (
        <div className="mt-4 p-3 bg-emerald-500/10 text-emerald-500 rounded-md text-sm border border-emerald-500/20">
          Successfully imported {result.count} reviews!
        </div>
      )}
    </div>
  );
}
