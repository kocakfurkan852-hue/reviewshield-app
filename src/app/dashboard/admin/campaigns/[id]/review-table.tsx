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
import { deleteReviews, transferReviews } from "@/app/actions/review";
import { getTransferableCampaigns } from "@/app/actions/campaign";
import { Trash2, MoveRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetCampaign, setTargetCampaign] = useState("");
  const [transferableCampaigns, setTransferableCampaigns] = useState<any[]>([]);

  // Settings State
  const [delCountry, setDelCountry] = useState(client?.deletion_country || "Deutschland");
  const [delName, setDelName] = useState(client?.deletion_name || client?.contact_name || "");
  const [delSignature, setDelSignature] = useState(client?.deletion_signature || client?.contact_name || "");
  const [ticketId, setTicketId] = useState("");

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
      await createRemovalRequest(campaignId, selectedReviewIds, ticketId);
      setSelectedReviewIds([]);
      setShowAutoModal(false);
    } catch (error) {
      console.error("Failed to create removal request:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviewIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedReviewIds.length} review(s)?`)) return;

    setSubmitting(true);
    try {
      await deleteReviews(selectedReviewIds, campaignId);
      setSelectedReviewIds([]);
    } catch (error) {
      alert("Failed to delete reviews.");
    } finally {
      setSubmitting(false);
    }
  };

  const openTransferModal = async () => {
    setSubmitting(true);
    try {
      const camps = await getTransferableCampaigns(campaignId);
      setTransferableCampaigns(camps);
      setShowTransferModal(true);
    } catch (error) {
      alert("Failed to load campaigns.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (selectedReviewIds.length === 0 || !targetCampaign) return;
    setSubmitting(true);
    try {
      await transferReviews(selectedReviewIds, campaignId, targetCampaign);
      setSelectedReviewIds([]);
      setShowTransferModal(false);
    } catch (error) {
      alert("Failed to transfer reviews.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateBookmarkletForChunk = (chunk: Review[]) => {
    const urlsAndText = chunk.map((r) => {
        return `URL: ${r.review_url}\\nText: ${r.review_text ? r.review_text.replace(/(\r\n|\n|\r)/gm, " ") : 'Kein Text'}`;
    }).join('\\n\\n');

    const reasoning = `Sehr geehrte Damen und Herren,\n\ndie vorliegende Bewertung ist aus folgenden Gründen zu löschen:\n\nDer Rezensent war niemals Kunde unseres Unternehmens. Eine Geschäftsbeziehung bestand zu keinem Zeitpunkt.\n\nNach ständiger Rechtsprechung sind Bewertungen ohne tatsächliche Geschäftsbeziehung unzulässig und verletzen das Persönlichkeitsrecht des Unternehmens (BGH, Urt. 01.03.2016, VI ZR 34/15). Die Bewertung verursacht erheblichen wirtschaftlichen Schaden.\n\nSie werden hiermit aufgefordert, Ihren vom BGH auferlegten Pflichten nachzukommen:\n\n1) Diese Beanstandung an den Verfasser weiterzuleiten\n2) Den Verfasser zur Stellungnahme aufzufordern mit Nachweis der Geschäftsbeziehung (Kundenkontakt, Rechnungen etc.)\n3) Die Rezension bei Nichtreaktion oder fehlendem Nachweis zu entfernen (BGH, Urt. 25.10.2011, VI ZR 93/10)\n\nWir erwarten Ihre Rückmeldung bis zum ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}.`;

    return `javascript:(function(){
      function findInputByLabel(text) {
        const labels = Array.from(document.querySelectorAll('label, div[role="heading"], span'));
        const label = labels.find(l => l.innerText.toLowerCase().includes(text.toLowerCase()));
        if (!label) return null;
        if (label.htmlFor) return document.getElementById(label.htmlFor);
        const inputInside = label.querySelector('input, textarea, select');
        if (inputInside) return inputInside;
        let current = label;
        while (current && current.nextElementSibling) {
          current = current.nextElementSibling;
          const input = current.querySelector('input, textarea, select');
          if (input) return input;
          if (['INPUT','TEXTAREA','SELECT'].includes(current.tagName)) return current;
        }
        const container = label.closest('div[role="listitem"]') || label.closest('.lrHppe');
        if (container) return container.querySelector('input:not([type="hidden"]), textarea, select');
        return null;
      }
      function simulateTyping(element, text) {
        if (!element) return;
        element.focus();
        const setter = Object.getOwnPropertyDescriptor(window[element.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype, "value").set;
        setter.call(element, text);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.blur();
      }
      function clickRadioOrCheckbox(text) {
        const labels = Array.from(document.querySelectorAll('label, span, div'));
        const label = labels.find(l => l.innerText.trim() === text);
        if (label) {
            label.click();
            const input = label.closest('div')?.querySelector('input[type="radio"], input[type="checkbox"]');
            if (input) {
                input.checked = true;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
      }
      const countryInput = findInputByLabel("Land Ihres Wohnsitzes") || findInputByLabel("Country of residence");
      if(countryInput) {
          if(countryInput.tagName === 'SELECT') {
              Array.from(countryInput.options).forEach(opt => {
                  if(opt.text.includes('${delCountry}')) countryInput.value = opt.value;
              });
              countryInput.dispatchEvent(new Event('change', {bubbles: true}));
          } else {
              simulateTyping(countryInput, '${delCountry}');
          }
      }
      simulateTyping(findInputByLabel("Vollständiger Name"), '${delName}');
      clickRadioOrCheckbox("Mich selbst");
      clickRadioOrCheckbox("Myself");
      
      const urlsAndText = \`${urlsAndText.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`;
      const reasoning = \`${reasoning.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`;
      
      const textareas = Array.from(document.querySelectorAll('textarea'));
      if (textareas.length > 0) {
          const reasonBox = findInputByLabel("Begründung") || findInputByLabel("grund") || textareas[textareas.length - 1];
          if (reasonBox) simulateTyping(reasonBox, reasoning);
          const urlBox = findInputByLabel("URL") || textareas[0];
          if (urlBox && urlBox !== reasonBox) {
              simulateTyping(urlBox, urlsAndText);
          } else if (textareas.length === 1) {
              simulateTyping(textareas[0], urlsAndText + '\\n\\nBegründung:\\n' + reasoning);
          }
      }
      
      clickRadioOrCheckbox("Ich schwöre an Eides statt");
      clickRadioOrCheckbox("Ich versichere an Eides statt");
      clickRadioOrCheckbox("zur Bestätigung aktivieren");
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.click(); cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true})); });
      
      simulateTyping(findInputByLabel("Unterschrift"), '${delSignature}');
      alert('ReviewShield: Automatisierung abgeschlossen. Bitte überprüfen Sie die Eingaben und füllen Sie ggf. das Captcha aus, bevor Sie auf Senden klicken.');
    })();`;
  };

  return (
    <div className="space-y-4">
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-md overflow-y-auto">
          <div className="vault-card bg-card p-6 rounded-md w-full max-w-4xl shadow-2xl relative border border-border mt-32 mb-8">
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
                  <Label>Google Ticket ID (Optional)</Label>
                  <Input 
                    placeholder="e.g. 1-234567890" 
                    value={ticketId} 
                    onChange={(e) => setTicketId(e.target.value)} 
                  />
                  <p className="text-[10px] text-muted-foreground">If you have the Ticket ID from Google, enter it here to link future emails automatically.</p>
                </div>
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
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={openTransferModal} 
              className="border-border text-foreground hover:bg-primary/10"
              disabled={submitting}
            >
              <MoveRight className="h-4 w-4 mr-2" />
              Transfer
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleBulkDelete} 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
              disabled={submitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowAutoModal(true)} 
              className="starlight-btn"
              disabled={submitting}
            >
              Automate Removal
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Transfer {selectedReviewIds.length} Review(s)</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Target Campaign</Label>
              <select 
                value={targetCampaign} 
                onChange={(e) => setTargetCampaign(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>-- Select a Campaign --</option>
                {transferableCampaigns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.client.company_name} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowTransferModal(false)} disabled={submitting}>Cancel</Button>
              <Button className="starlight-btn" onClick={handleBulkTransfer} disabled={submitting || !targetCampaign}>
                Confirm Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
