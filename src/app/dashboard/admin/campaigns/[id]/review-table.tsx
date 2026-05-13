"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function ReviewTable({ campaignId, reviews, client }: { campaignId: string, reviews: Review[], client?: any }) {
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);

  // Settings State
  const [delCountry, setDelCountry] = useState(client?.deletion_country || "Deutschland");
  const [delName, setDelName] = useState(client?.deletion_name || client?.contact_name || "");
  const [delSignature, setDelSignature] = useState(client?.deletion_signature || client?.contact_name || "");

  const selectedReviews = reviews.filter(r => selectedReviewIds.includes(r.id));

  // Split selected reviews into chunks of 10
  const chunks = [];
  for (let i = 0; i < selectedReviews.length; i += 10) {
    chunks.push(selectedReviews.slice(i, i + 10));
  }

  const toggleSelect = (id: string) => {
    setSelectedReviewIds(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleBatchSubmit = async () => {
    if (selectedReviewIds.length === 0) return;
    
    setSubmitting(true);
    try {
      await createRemovalRequest(campaignId, selectedReviewIds, "AUTOMATED_BOOKMARKLET");
      setSelectedReviewIds([]);
      setShowAutoModal(false);
    } catch (error) {
      console.error("Failed to create removal request:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateBookmarkletForChunk = (chunk: Review[]) => {
    const urlsAndText = chunk.map((r) => {
        return `URL: ${r.review_url}\\nText: ${r.review_text ? r.review_text.replace(/(\r\n|\n|\r)/gm, " ") : 'Kein Text'}`;
    }).join('\\n\\n');

    const reasoning = `Sehr geehrte Damen und Herren,\n\ndie vorliegende Bewertung ist aus folgenden Gründen zu löschen:\n\nDer Rezensent war niemals Kunde unseres Unternehmens. Eine Geschäftsbeziehung bestand zu keinem Zeitpunkt.\n\nNach ständiger Rechtsprechung sind Bewertungen ohne tatsächliche Geschäftsbeziehung unzulässig und verletzen das Persönlichkeitsrecht des Unternehmens (BGH, Urt. 01.03.2016, VI ZR 34/15). Die Bewertung verursacht erheblichen wirtschaftlichen Schaden.\n\nSie werden hiermit aufgefordert, Ihren vom BGH auferlegten Pflichten nachzukommen:\n\n1) Diese Beanstandung an den Verfasser weiterzuleiten\n2) Den Verfasser zur Stellungnahme aufzufordern mit Nachweis der Geschäftsbeziehung (Kundenkontakt, Rechnungen etc.)\n3) Die Rezension bei Nichtreaktion oder fehlendem Nachweis zu entfernen (BGH, Urt. 25.10.2011, VI ZR 93/10)\n\nWir erwarten Ihre Rückmeldung bis zum ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}.`;

    // Note: To properly automate filling the Google Form in a bookmarklet, one would need to inspect Google's DOM. 
    // This script mocks the process and is a placeholder for the actual DOM logic.
    return `javascript:(function(){
      alert('ReviewShield: Fülle Google Formular aus für ${chunk.length} Reviews...\\n\\nWohnsitz: ${delCountry}\\nName: ${delName}\\nUnterschrift: ${delSignature}');
      console.log('Inserting into textareas:', \`${urlsAndText}\`);
      console.log('Inserting reasoning:', \`${reasoning}\`);
    })();`;
  };

  return (
    <div className="space-y-4">
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="vault-card p-6 rounded-md w-full max-w-4xl shadow-xl relative border border-border mt-32 mb-8">
            <button 
              onClick={() => setShowAutoModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">Automate Removal Submission</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You selected {selectedReviews.length} reviews. Google's form limits submissions to 10 links at a time.
              These have been split into <strong>{chunks.length} batches</strong> automatically.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Settings */}
              <div className="space-y-4 border-r border-border pr-8">
                <h3 className="text-md font-semibold text-foreground mb-2">Submission Settings</h3>
                <div className="space-y-2">
                  <Label>Land ihres Wohnsitzes (Country)</Label>
                  <Input value={delCountry} onChange={(e) => setDelCountry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Vollständiger Name (Full Name)</Label>
                  <Input value={delName} onChange={(e) => setDelName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Unterschrift (Signature)</Label>
                  <Input value={delSignature} onChange={(e) => setDelSignature(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  These settings are injected into the bookmarklets on the right.
                </p>
              </div>

              {/* Bookmarklets / Next Steps */}
              <div className="space-y-6">
                <h3 className="text-md font-semibold text-foreground">Batches to Submit</h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {chunks.map((chunk, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 border border-border rounded bg-muted/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Batch {i + 1} ({chunk.length} links)</span>
                      </div>
                      <a 
                        href={generateBookmarkletForChunk(chunk)}
                        className="inline-block px-3 py-1.5 bg-blue-500 text-white rounded text-center cursor-grab shadow-sm text-sm hover:bg-blue-600 transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        Drag to Bookmarks (Batch {i + 1})
                      </a>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-4">
                    After you have finished dragging and executing these batches in the Google Form, click below to mark them as submitted in ReviewShield.
                  </p>
                  <Button onClick={handleBatchSubmit} disabled={submitting} className="w-full starlight-btn">
                    {submitting ? "Updating..." : "Mark All as Submitted"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReviewIds.length > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {selectedReviewIds.length} review(s) selected
          </div>
          <div className="flex items-center gap-4">
            <Button 
              size="sm" 
              onClick={() => setShowAutoModal(true)} 
              className="starlight-btn"
            >
              Automate Removal Requests
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
                <TableCell className="font-medium text-foreground">
                  <a href={`/dashboard/admin/campaigns/${campaignId}/reviews/${review.id}`} className="text-primary hover:underline">
                    {review.reviewer_name || "Unknown Reviewer"}
                  </a>
                </TableCell>
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
