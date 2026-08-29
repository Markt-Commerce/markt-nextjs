'use client';

import { useEffect, useState } from 'react';
import { Calendar, FileText, Clock, Search, Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './page.module.css';

const SECTIONS = [
  { id: 's1', label: '1. Acceptance of Terms' },
  { id: 's2', label: '2. Definitions' },
  { id: 's3', label: '3. User Accounts' },
  { id: 's4', label: '4. Platform Usage' },
  { id: 's5', label: '5. Prohibited Activities' },
  { id: 's6', label: '6. Intellectual Property' },
  { id: 's7', label: '7. Payment Terms' },
];

export default function TermsPage() {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const content = document.querySelector(`.${styles.prose}`) as HTMLElement | null;
      if (!content) {
        setProgress(0);
        return;
      }
      const total = content.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(window.scrollY - content.offsetTop, 0), Math.max(total, 1));
      setProgress(Math.max(0, Math.min(100, (scrolled / Math.max(total, 1)) * 100)));
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  const scrollTo = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: 'Markt Terms', url: window.location.href }).catch(() => {});
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero} role="banner" aria-label="Terms hero">
        <img
          src="https://storage.googleapis.com/uxpilot-auth.appspot.com/8d5e315f02-d96d6a9184fd4982fcb3.png"
          alt="professional legal documents on desk"
          className={styles.heroBg}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Terms &amp; Conditions</h1>
          <p className={styles.heroSub}>Legal terms and user agreement for the Markt platform</p>
          <div className={styles.heroMeta} aria-label="Document meta">
            <span><Calendar size={14} /> Last updated: December 15, 2024</span>
            <span><FileText size={14} /> Version 2.1</span>
            <span><Clock size={14} /> 15 min read</span>
          </div>
        </div>
      </section>

      <div className={styles.container}>
        <aside className={styles.toc} aria-label="Table of contents">
          <div className={cn(styles.card, styles.sticky)}>
            <div className={styles.cardHead}>
              <h3>Table of Contents</h3>
              <button
                className={styles.iconBtn}
                onClick={() => setShowSearch((s) => !s)}
                aria-label="Toggle search"
                type="button"
              >
                <Search size={14} />
              </button>
            </div>
            <div className={cn(styles.search, !showSearch && styles.searchHidden)}>
              <input
                type="text"
                className={styles.input}
                placeholder="Search terms..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search terms"
              />
            </div>
            <nav className={styles.tocList}>
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  className={styles.tocLink}
                  href={`#${section.id}`}
                  onClick={(e) => scrollTo(e, section.id)}
                >
                  {section.label}
                </a>
              ))}
            </nav>
            <div className={styles.progress}>
              <div className={styles.progressLabel}>Reading Progress</div>
              <div className={styles.bar}>
                <div className={styles.barFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </aside>

        <main className={styles.content} aria-label="Terms content">
          <div className={styles.card}>
            <div className={styles.actionBar}>
              <div className={styles.left}>
                <span className={styles.muted}>Version 2.1 • Effective December 15, 2024</span>
                <span className={cn(styles.pill, styles.success)}>Current Version</span>
              </div>
              <div className={styles.right}>
                <button className={styles.btn} onClick={() => window.print()} type="button">
                  <Printer size={14} /><span>Print</span>
                </button>
                <button className={styles.btn} type="button">
                  <Download size={14} /><span>PDF</span>
                </button>
                <button className={styles.btn} onClick={share} type="button">
                  <Share2 size={14} /><span>Share</span>
                </button>
              </div>
            </div>

            <div className={styles.prose}>
              <section id="s1">
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing or using the Markt platform, you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the service.</p>
                <p>These Terms apply to all visitors, users, and others who access or use the service, including students, sellers, and campus community members.</p>
              </section>

              <section id="s2">
                <h2>2. Definitions</h2>
                <div className={styles.note}>
                  <ul>
                    <li><strong>&quot;Platform&quot;</strong> refers to the Markt social e-commerce platform</li>
                    <li><strong>&quot;User&quot;</strong> means any person who accesses or uses our platform</li>
                    <li><strong>&quot;Seller&quot;</strong> refers to users who list products or services for sale</li>
                    <li><strong>&quot;Buyer&quot;</strong> refers to users who purchase products or services</li>
                    <li><strong>&quot;Content&quot;</strong> includes all text, images, videos, and other materials</li>
                  </ul>
                </div>
              </section>

              <section id="s3">
                <h2>3. User Accounts</h2>
                <p>To access certain features of the platform, you must register for an account. You are responsible for:</p>
                <ul>
                  <li>Providing accurate and complete information</li>
                  <li>Maintaining the security of your account credentials</li>
                  <li>Notifying us of any unauthorized access</li>
                  <li>Being responsible for all activities under your account</li>
                </ul>
              </section>

              <section id="s4">
                <h2>4. Platform Usage</h2>
                <p>You may use our platform for lawful purposes only. You agree to comply with all applicable laws and regulations when using our services.</p>
                <div className={styles.callout}>
                  <p><strong>Campus Community Guidelines:</strong> As a platform designed for students and campus communities, we expect all users to maintain respectful and professional interactions.</p>
                </div>
              </section>

              <section id="s5">
                <h2>5. Prohibited Activities</h2>
                <p>You are prohibited from:</p>
                <div className={styles.grid2}>
                  <div className={styles.danger}>
                    <h4>Content Violations</h4>
                    <ul>
                      <li>Posting illegal or harmful content</li>
                      <li>Sharing copyrighted materials</li>
                      <li>Spreading misinformation</li>
                    </ul>
                  </div>
                  <div className={styles.danger}>
                    <h4>Platform Abuse</h4>
                    <ul>
                      <li>Creating fake accounts</li>
                      <li>Manipulating reviews or ratings</li>
                      <li>Engaging in fraudulent activities</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="s6">
                <h2>6. Intellectual Property Rights</h2>
                <p>The platform and its original content, features, and functionality are owned by Markt and are protected by international copyright, trademark, and other intellectual property laws.</p>
              </section>

              <section id="s7">
                <h2>7. Payment Terms</h2>
                <p>All transactions are processed securely through our payment partners. Fees and charges will be clearly displayed before completion of any transaction.</p>
              </section>
            </div>

            <div className={styles.accept}>
              <h3>Terms Acceptance</h3>
              <p>By continuing to use Markt, you acknowledge that you have read and agree to these terms.</p>
              <div className={styles.acceptRow}>
                <span className={styles.accepted}><CheckCircle2 size={14} /> Accepted on December 10, 2024</span>
                <button className={styles.primary} type="button">View Acceptance History</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
