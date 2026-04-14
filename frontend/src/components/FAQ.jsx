import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { faqs } from '../data/faq';

function FAQItem({ faq }) { // this is the FAQ item component
  const [isOpen, setIsOpen] = useState(false); // this state is used to store whether the FAQ item is open or not

  return (
    <div className={`border rounded-card bg-void/60 overflow-hidden transition-all duration-300 ${isOpen ? 'border-ultraviolet shadow-glow' : 'border-border/30 hover:border-border/60'}`}>
      <button // this is the button that is clicked to open and close the FAQ item
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-start sm:items-center px-6 py-5 text-left transition-colors duration-300 ${isOpen ? 'text-ultraviolet border-b border-ultraviolet/30 bg-ultraviolet/5' : 'text-text-primary border-b border-transparent hover:text-white'}`}
      >
        <span className="font-mono font-bold text-lg sm:text-xl pr-4">{faq.question}</span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="shrink-0 flex items-center justify-center mt-1 sm:mt-0"
        >
          <svg width="18" height="14" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10L0 0H14L7 10Z" fill="currentColor" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {/* Frame motion wrapper animates height from 0 to its natural 'auto' size */}
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 pt-5 text-text-primary font-body leading-relaxed text-base sm:text-lg">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() { // this is the FAQ component
  return (
    <div className="section-wrapper">
      <h2 className="section-title text-center">Frequently Asked Questions</h2>

      {/* Surface card — matches carousel / other sections */}
      <div className="bg-surface rounded-3xl py-8 sm:py-12 px-6 sm:px-12 mt-6 sm:mt-10">
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} />
          ))}
        </div>
      </div>{/* end surface card */}

    </div>
  );
}