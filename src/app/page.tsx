'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const STEPS = [
  { number: '01', title: 'Find your people', copy: 'Follow curators, sellers, and communities that make you want to look twice.' },
  { number: '02', title: 'See the story', copy: 'Ask questions, watch live, and get the context that makes a find feel personal.' },
  { number: '03', title: 'Make it yours', copy: 'Buy with confidence and keep discovering what is next.' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className={styles.landingShell}>
      <div className={styles.structureGrid} aria-hidden="true" />

      <header className={styles.siteHeader} aria-label="Primary navigation">
        <Link href="/" className={styles.brand} aria-label="Markt home">
          <span className={styles.brandMark}>M</span>
          <span className={styles.brandName}>Markt</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Main menu">
          <a href="#story">Our story</a>
          <a href="#how-it-works">How it works</a>
          <a href="#featured">Featured finds</a>
        </nav>
        <div className={styles.headerActions}>
          <button className={styles.themeButton} type="button" aria-label="Toggle dark mode" title="Toggle dark mode">
            ◐
          </button>
          <Link href={'/app/marketplace'} className={styles.appButton}>
            Explore Markt <span aria-hidden="true">↗</span>
          </Link>
          <button
            className={styles.menuButton}
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={menuOpen ? styles.menuOpen : undefined} />
            <span className={menuOpen ? styles.menuOpen : undefined} />
            <span className={menuOpen ? styles.menuOpen : undefined} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className={styles.mobileNavOpen}>
          <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#featured" onClick={() => setMenuOpen(false)}>Featured finds</a>
          <Link href={'/app/marketplace'} onClick={() => setMenuOpen(false)}>
            Explore the marketplace <span>↗</span>
          </Link>
        </div>
      )}

      <section className={styles.hero} id="story">
        <p className={styles.eyebrow}>A marketplace with a pulse</p>
        <h1>
          Shopping, the way it
          <br />
          <em>connects us.</em>
        </h1>
        <p className={styles.heroCopy}>
          Discover products through people, not just sterile listings. Find your next favorite thing
          through the stories, taste, and energy of a real community.
        </p>
        <div className={styles.heroActions}>
          <Link href={'/app/marketplace'} className={styles.exploreButton}>
            Explore the marketplace <span>↗</span>
          </Link>
          <Link href={'/auth/register'} className={styles.sellerLink}>
            I want to sell <span>↗</span>
          </Link>
        </div>
      </section>

      <section className={styles.productRail} id="featured" aria-label="Featured products">
        <article className={styles.productCard}>
          <img src="/assets/landing/fashion-shoes.jpg" alt="Fashion shoes" />
          <span className={styles.cardLabel}>Move with intention</span>
        </article>
        <article className={styles.productCard}>
          <img
            src="/assets/landing/graphic-tshirt-trendy-design-mockup-presented-wooden-hanger.jpg"
            alt="Graphic T-shirt on a hanger"
          />
          <span className={styles.cardLabel}>The good kind of rare</span>
        </article>
        <article className={styles.productCard}>
          <img src="/assets/landing/handbag.jpg" alt="Pink handbag" />
          <span className={styles.cardLabel}>Carry something good</span>
        </article>
        <article className={styles.productCard}>
          <img
            src="/assets/landing/closeup-shot-modern-cool-black-digital-watch-with-brown-leather-strap.jpg"
            alt="Black watch with a leather strap"
          />
          <span className={styles.cardLabel}>Details matter</span>
        </article>
      </section>

      <section className={styles.introSection} id="how-it-works">
        <p className={styles.eyebrow}>More than a product page</p>
        <div>
          <h2>
            Good finds feel
            <br />
            <em>better together.</em>
          </h2>
          <p>
            Markt brings the human part of shopping forward. Follow people with great taste, ask the
            question you actually want answered, and discover pieces with a story behind them.
          </p>
          <Link href={'/app/marketplace'} className={styles.textLink}>
            Explore the marketplace <span>↗</span>
          </Link>
        </div>
      </section>

      <section className={styles.stepsSection} aria-label="How Markt works">
        {STEPS.map((step) => (
          <div className={styles.step} key={step.number}>
            <span className={styles.stepNumber}>{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </div>
        ))}
      </section>

      <section className={styles.closingCta}>
        <p className={styles.eyebrow}>Your next find is out there</p>
        <h2>
          Come for the product.
          <br />
          <em>Stay for the people.</em>
        </h2>
        <Link href={'/auth/register'} className={styles.darkButton}>
          Start exploring <span>↗</span>
        </Link>
      </section>

      <footer className={styles.siteFooter}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>M</span>
          <span className={styles.brandName}>Markt</span>
        </Link>
        <p>Shopping, the way it connects us.</p>
        <div className={styles.footerLinks}>
          <Link href="/app/support/faq">Support</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}
