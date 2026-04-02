// Displays the FAQ accordion on the homepage.
// Imports FAQ data from data/faq.js
// The navbar's "FAQ" link uses href="/#faq" to scroll to this section.

import { faqs } from '../data/faq';                // import the faqs array from the data folder

export default function FAQ() {
  return (
    <div>                                           {/* wrapper for the FAQ block */}
      <h2>Frequently Asked Questions</h2>           {/* section heading */}

      {faqs.map((faq, index) => (                   // .map() loops over each faq object in the array
        <details key={index}>                       {/* <details> is native HTML for a disclosure/accordion — no JS needed */}
          <summary>{faq.question}</summary>         {/* <summary> is the visible clickable part that shows/hides the answer */}
          <p>{faq.answer}</p>                       {/* the answer text shown when the item is expanded */}
        </details>
      ))}

    </div>
  );
}