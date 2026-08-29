import Link from 'next/link';
import styles from './page.module.css';

// The real API has no FAQ/support-content endpoint — this is static content,
// not a mock standing in for a missing backend feature.
const FAQS = [
  {
    q: 'How do I switch between buying and selling?',
    a: 'Go to Settings, under Account type. If you already have both a buyer and seller account, you can switch instantly; otherwise you can add the other one from the same page.',
  },
  {
    q: 'Why can’t I access my cart?',
    a: 'Cart and checkout are buyer-only. If you’re signed in as a seller, switch to your buyer account first in Settings.',
  },
  {
    q: 'How do buy requests and offers work?',
    a: 'Buyers post what they’re looking for under Requests. Sellers browse open requests and send an offer with a price and message. The buyer can accept, decline, or wait for more offers.',
  },
  {
    q: 'Where do I manage product photos?',
    a: 'Seller accounts have a Media Library in the sidebar for uploading and managing images and videos.',
  },
  {
    q: 'How do refunds and returns work?',
    a: 'Open the order under Orders and use the return/cancel options there, if the order is still eligible.',
  },
];

export default function SupportPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Help &amp; Support
      </h1>
      <p className={styles.subtitle}>Answers to common questions. Can&apos;t find what you need? Reach out directly.</p>

      {FAQS.map((item) => (
        <div key={item.q} className={styles.faqItem}>
          <p className={styles.faqQuestion}>{item.q}</p>
          <p className={styles.faqAnswer}>{item.a}</p>
        </div>
      ))}

      <div className={styles.contactCard}>
        <p>Still stuck? We&apos;re happy to help.</p>
        <Link href="/app/contact" className={styles.contactBtn}>
          Contact Us
        </Link>
      </div>
    </div>
  );
}
