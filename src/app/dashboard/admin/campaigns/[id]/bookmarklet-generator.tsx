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
      console.log("ReviewShield: Starting auto-fill...");
      
      const findAndFill = (selectors, value, type = "input") => {
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el) {
            console.log("ReviewShield: Found " + selector);
            if (type === "input") {
              el.value = value;
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            } else if (type === "click") {
              el.click();
            } else if (type === "select") {
              // Material selects are tricky, often need a click then finding the option
              el.click();
              setTimeout(() => {
                const option = Array.from(document.querySelectorAll('material-select-item, [role="option"]'))
                  .find(opt => opt.textContent.includes(value));
                if (option) option.click();
              }, 500);
            }
            return true;
          }
        }
        return false;
      };

      /* 1. Country / Wohnsitz */
      findAndFill(["material-select[aria-label='Land Ihres Wohnsitzes']", "[name='country_of_residence']", "material-select[aria-label*='Land']"], "Deutschland", "select");

      /* 2. Full Name */
      findAndFill(["input[aria-label='Vollständiger Name']", "[name='full_name']", "input[aria-label*='Name']"], "Süleyman Furkan Kocak");

      /* 3. Acting on behalf of myself */
      const myself = Array.from(document.querySelectorAll('material-radio')).find(r => r.textContent.includes('meinem eigenen Namen') || r.textContent.includes('myself'));
      if (myself) myself.click();

      /* 4. URLs and Reasons */
      const urls = ${JSON.stringify(urls)};
      const reasonText = "Sehr geehrte Damen und Herren,\\n\\ndiese Bewertung verstößt gegen die Richtlinien (unwahre Tatsachenbehauptung/Schmähkritik) und stellt eine Rechtsverletzung dar. Wir bitten um umgehende Löschung.\\n\\nMit freundlichen Grüßen,\\nSüleyman Furkan Kocak";
      
      const urlInputs = document.querySelectorAll('input[aria-label*="URL"], [name^="url_"]');
      const reasonInputs = document.querySelectorAll('textarea[aria-label*="Begründen Sie"], [name^="reason_"]');
      
      for(let i=0; i<Math.min(urls.length, urlInputs.length); i++) {
        urlInputs[i].value = urls[i];
        urlInputs[i].dispatchEvent(new Event("input", { bubbles: true }));
        if(reasonInputs[i]) {
          reasonInputs[i].value = reasonText;
          reasonInputs[i].dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      
      /* 5. Confirmation Checkbox */
      const checkbox = document.querySelector("material-checkbox[aria-label*='Zur Bestätigung aktivieren'], material-checkbox[aria-label*='confirm']");
      if(checkbox && !checkbox.classList.contains('checked')) checkbox.click();

      /* 6. Signature */
      findAndFill(["input[aria-label='Unterschrift']", "[name='signature']", "input[aria-label*='Unterschrift']"], "Süleyman Furkan Kocak");
      
      alert("ReviewShield: Form auto-filled with " + urls.length + " reviews! Please check the country field, complete the Captcha and submit.");
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
