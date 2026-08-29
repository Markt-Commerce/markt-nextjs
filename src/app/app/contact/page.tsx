import Link from 'next/link';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';
import styles from './page.module.css';

// The real API has no contact/ticket-submission endpoint — no form here
// pretends to submit somewhere it doesn't. These are real, working
// contact paths instead: a mailto link and the in-app chat.
export default function ContactPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Contact Us
      </h1>
      <p className={styles.subtitle}>The fastest ways to reach us.</p>

      <div className={styles.card}>
        <a href="mailto:support@marktcommerce.com?subject=Markt%20support%20request" className={styles.row}>
          <div className={styles.iconWrap}>
            <Mail size={17} />
          </div>
          <div>
            <p className={styles.rowLabel}>Email support</p>
            <p className={styles.rowMeta}>support@marktcommerce.com</p>
          </div>
        </a>

        <Link href="/app/chat/start" className={styles.row}>
          <div className={styles.iconWrap}>
            <MessageCircle size={17} />
          </div>
          <div>
            <p className={styles.rowLabel}>Message a seller</p>
            <p className={styles.rowMeta}>For order- or product-specific questions</p>
          </div>
        </Link>

        <Link href="/app/support" className={styles.row}>
          <div className={styles.iconWrap}>
            <HelpCircle size={17} />
          </div>
          <div>
            <p className={styles.rowLabel}>Help &amp; Support</p>
            <p className={styles.rowMeta}>Answers to common questions</p>
          </div>
        </Link>
      </div>

      <p className={styles.note}>
        Emailing us directly is the most reliable option right now — there&apos;s no in-app support ticket system yet.
      </p>
    </div>
  );
}
