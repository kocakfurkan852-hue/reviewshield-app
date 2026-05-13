"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createRemovalRequest } from "@/app/actions/removal_request";

interface Review {
  id: string;
  reviewer_name?: string | null;
  review_text?: string | null;
  star_rating: number;
  review_url: string;
  status: string;
  created_at: Date | string;
}

export function ReviewTable({ campaignId, reviews }: { campaignId: string, reviews: Review[] }) {
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [googleRefId, setGoogleRefId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedReviewIds(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleBatchSubmit = async () => {
    if (selectedReviewIds.length === 0) return;
    
    setSubmitting(true);
    try {
      await createRemovalRequest(campaignId, selectedReviewIds, googleRefId);
      setSelectedReviewIds([]);
      setGoogleRefId("");
    } catch (error) {
      console.error("Failed to create removal request:", error);
      alert("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedReviewIds.length > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {selectedReviewIds.length} review(s) selected
          </div>
          <div className="flex items-center gap-4">
            <Input 
              placeholder="Google Ticket ID (Optional)" 
              value={googleRefId}
              onChange={(e) => setGoogleRefId(e.target.value)}
              className="w-64 bg-background border-border text-foreground h-9"
            />
            <Button 
              size="sm" 
              onClick={handleBatchSubmit} 
              disabled={submitting}
              className="starlight-btn"
            >
              {submitting ? "Submitting..." : "Submit Removal Request"}
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              <input 
                type="checkbox" 
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedReviewIds(reviews.filter(r => r.status === 'PENDING').map(r => r.id));
                  } else {
                    setSelectedReviewIds([]);
                  }
                }}
                checked={selectedReviewIds.length > 0 && selectedReviewIds.length === reviews.filter(r => r.status === 'PENDING').length}
                className="rounded border-border bg-transparent text-primary focus:ring-primary h-4 w-4"
              />
            </TableHead>
            <TableHead>Reviewer Name</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Snippet</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No reviews tracked yet. Upload a CSV to get started.
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((review) => (
              <TableRow key={review.id} className={selectedReviewIds.includes(review.id) ? "bg-primary/5" : ""}>
                <TableCell className="text-center">
                  <input 
                    type="checkbox" 
                    disabled={review.status !== 'PENDING'}
                    checked={selectedReviewIds.includes(review.id)}
                    onChange={() => toggleSelect(review.id)}
                    className="rounded border-border bg-transparent text-primary focus:ring-primary h-4 w-4 disabled:opacity-50"
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">{review.reviewer_name}</TableCell>
                <TableCell>
                  <div className="flex text-amber-500">
                    {"★".repeat(review.star_rating)}{"☆".repeat(5 - review.star_rating)}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {review.review_text || <span className="italic">No text</span>}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    review.status === 'PENDING' ? 'bg-border/50 text-foreground' : 
                    review.status === 'SUBMITTED' ? 'bg-amber-500/20 text-amber-500' : 
                    review.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-500' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {review.status}
                  </span>
                </TableCell>
                <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="border-border text-foreground" onClick={() => window.open(review.review_url, '_blank')}>
                    View Map
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
