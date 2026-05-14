"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BookmarkletGenerator({ reviews }: { reviews: any[] }) {
  const [show, setShow] = useState(false);

  // Get up to 10 pending reviews
  const pendingReviews = reviews.filter(r => r.status === "PENDING" || r.status === "SUBMITTED").slice(0, 10);

  if (pendingReviews.length === 0) return null;

  const urls = pendingReviews.map(r => r.review_url);
  const reviewIds = pendingReviews.map(r => r.id);

  // The JS code that will be injected into the bookmarklet
  const bookmarkletCode = `javascript:(function(){
    try {
      /* This is a mockup for the Google Support Form */
      /* Sets Wohnsitz to Deutschland */
      const countrySelect = document.querySelector('select[name="country"]');
      if (countrySelect) { countrySelect.value = "DE"; countrySelect.dispatchEvent(new Event("change")); }
      
      /* Checks "mich selbst" */
      const myselfRadio = document.querySelector('input[value="myself"]');
      if (myselfRadio) { myselfRadio.checked = true; myselfRadio.dispatchEvent(new Event("change")); }

      /* Inputs name */
      const nameInput = document.querySelector('input[name="full_name"]');
      if (nameInput) { nameInput.value = "Süleyman Furkan Kocak"; nameInput.dispatchEvent(new Event("input")); }

      /* Populates URLs */
      const urls = ${JSON.stringify(urls)};
      const reasonText = "Sehr geehrte Damen und Herren,\\n\\ndiese Bewertung verstößt gegen die Richtlinien und stellt eine Rechtsverletzung dar. Wir bitten um umgehende Löschung.\\n\\nMit freundlichen Grüßen,\\nSüleyman Furkan Kocak";
      
      let urlInputs = document.querySelectorAll('input[name^="url_"]');
      let reasonInputs = document.querySelectorAll('textarea[name^="reason_"]');
      
      /* If Google requires clicking 'Add more' to show 10 fields, we'd trigger that here */
      /* For now, just fill whatever fields exist */
      for(let i=0; i<Math.min(urls.length, urlInputs.length); i++) {
        urlInputs[i].value = urls[i];
        urlInputs[i].dispatchEvent(new Event("input"));
        if(reasonInputs[i]) {
          reasonInputs[i].value = reasonText;
          reasonInputs[i].dispatchEvent(new Event("input"));
        }
      }
      
      /* Sign bottom */
      const signatureInput = document.querySelector('input[name="signature"]');
      if(signatureInput) { signatureInput.value = "Süleyman Furkan Kocak"; signatureInput.dispatchEvent(new Event("input")); }
      
      alert("ReviewShield: Form auto-filled with " + urls.length + " reviews! Please complete the Captcha and submit.");
    } catch(e) {
      alert("ReviewShield Bookmarklet Error: " + e.message);
    }
  })();`;

  // Provide a cleaner encoded version
  const encodedBookmarklet = encodeURI(bookmarkletCode);

  return (
    <div className="vault-card p-6 rounded-md mb-8 border-primary/30">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">Semi-Automated Submission (Magic Script)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag the button below to your bookmarks bar. Click it when you are on the Google Support page to auto-fill the form with {pendingReviews.length} pending reviews.
          </p>
        </div>
        <Button onClick={() => setShow(!show)} variant="outline">
          {show ? "Hide Settings" : "Configure"}
        </Button>
      </div>

      {show && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-col items-center p-8 bg-muted/30 rounded-md border border-dashed border-border mb-4">
            <a 
              href={encodedBookmarklet}
              className="starlight-btn px-6 py-3 rounded-full text-sm font-bold shadow-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
              title="Drag me to your Bookmarks Bar!"
              onClick={(e) => e.preventDefault()} // Prevent clicking it here
            >
              🚀 ReviewShield Auto-Fill ({pendingReviews.length})
            </a>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              ← Drag this button to your browser's bookmark bar.
            </p>
          </div>

          <div className="text-xs font-mono bg-background p-4 rounded border border-border text-muted-foreground overflow-x-auto">
            {bookmarkletCode}
          </div>
        </div>
      )}
    </div>
  );
}
