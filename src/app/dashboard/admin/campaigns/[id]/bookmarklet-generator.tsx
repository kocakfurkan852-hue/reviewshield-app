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
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      const findAndFill = async (selectors, value, type = "input") => {
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el) {
            console.log("ReviewShield: Found " + selector);
            if (type === "input") {
              el.value = value;
              el.setAttribute('value', value);
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
              el.dispatchEvent(new Event("blur", { bubbles: true }));
            } else if (type === "click") {
              el.click();
            } else if (type === "select") {
              el.click();
              await sleep(800);
              const options = Array.from(document.querySelectorAll('material-select-item, [role="option"], .material-select-dropdown material-select-item, div[role="listbox"] div[role="option"]'));
              const option = options.find(opt => opt.textContent.trim().toLowerCase().includes(value.toLowerCase()) || opt.getAttribute('data-value') === 'DE');
              if (option) {
                option.click();
                console.log("ReviewShield: Selected " + value);
              }
            }
            return true;
          }
        }
        return false;
      };

      (async () => {
        console.log("ReviewShield: Starting auto-fill...");
        
        /* 1. Country / Wohnsitz */
        await findAndFill(["div[role='listbox'][aria-label*='Land']", "material-select[aria-label*='Land']", "material-select[aria-label*='Wohnsitz']"], "Deutschland", "select");
        await sleep(500);

        /* 2. Full Name */
        await findAndFill(["input[aria-label*='Vollständiger Name']", "input[jsname='YPqjbf'][aria-label*='Name']", "input[name='full_name']"], "Süleyman Furkan Kocak");

        /* 3. Acting on behalf of myself */
        const radios = Array.from(document.querySelectorAll('material-radio, [role="radio"], div[role="radio"]'));
        const myself = radios.find(r => r.textContent.includes('meinem eigenen Namen') || r.textContent.includes('myself') || r.textContent.includes('In my own name') || r.getAttribute('aria-label')?.includes('eigenen Namen'));
        if (myself) {
          myself.click();
          console.log("ReviewShield: Clicked 'Own Behalf'");
        }

        /* 4. URLs and Reasons */
        const urls = ${JSON.stringify(urls)};
        const reasonText = "Diese Bewertung ist rechtswidrig, da sie unwahre Tatsachenbehauptungen und Schmähkritik enthält, die gegen die Google-Richtlinien und geltendes Recht verstoßen. Es gab keinen geschäftlichen Kontakt zwischen dem Verfasser und unserem Mandanten. Wir fordern die Löschung.";
        
        /* Find all URL inputs and textareas */
        const urlInputs = Array.from(document.querySelectorAll('input[aria-label*="URL des Inhalts"], textarea[aria-label*="URL des Inhalts"], [name^="url_"]'));
        const reasonInputs = Array.from(document.querySelectorAll('textarea[aria-label*="Begründen Sie"], [name^="reason_"]'));
        
        console.log("ReviewShield: Found " + urlInputs.length + " URL fields");

        for(let i=0; i<Math.min(urls.length, urlInputs.length); i++) {
          urlInputs[i].value = urls[i];
          urlInputs[i].dispatchEvent(new Event("input", { bubbles: true }));
          urlInputs[i].dispatchEvent(new Event("change", { bubbles: true }));
          if(reasonInputs[i]) {
            reasonInputs[i].value = reasonText;
            reasonInputs[i].dispatchEvent(new Event("input", { bubbles: true }));
            reasonInputs[i].dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
        
        /* 5. Confirmation Checkbox */
        await sleep(1000);
        const checkboxes = Array.from(document.querySelectorAll("material-checkbox, [role='checkbox'], div[role='checkbox']"));
        const confirmBox = checkboxes.find(c => c.textContent.includes('Bestätigung') || c.getAttribute('aria-label')?.includes('Bestätigung') || c.getAttribute('aria-label')?.includes('confirm'));
        if(confirmBox) {
          const isChecked = confirmBox.classList.contains('checked') || confirmBox.getAttribute('aria-checked') === 'true';
          if (!isChecked) {
            confirmBox.click();
            console.log("ReviewShield: Checked confirmation box");
          }
        }

        /* 6. Signature */
        await findAndFill(["input[aria-label*='Unterschrift']", "input[name='signature']", "input[jsname='YPqjbf'][aria-label*='Unterschrift']"], "Süleyman Furkan Kocak");
        
        alert("ReviewShield: Fertig! Bitte prüfen Sie das Land und lösen Sie das Captcha.");
      })();
    } catch(e) {
      console.error(e);
      alert("ReviewShield Fehler: " + e.message);
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
