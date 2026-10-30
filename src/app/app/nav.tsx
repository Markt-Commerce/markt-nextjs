'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import {
  Home,
  Store,
  Users,
  MessageCircle,
  Receipt,
  Tag,
  Clipboard,
  ShoppingCart,
  Settings,
  HelpCircle,
  Mail,
  Star,
  Heart,
  CreditCard,
  ImagePlus,
  UserCircle,
  Newspaper,
  LayoutDashboard,
  Search,
  Package,
  ClipboardList,
  Building2,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { getSidebarServerSnapshot, getSidebarSnapshot, subscribeSidebar } from '@/lib/sidebar-storage';
import type { AppMode } from '@/lib/business-mode';
import { effectiveMode } from './mode-switch';
import styles from './layout.module.css';

interface NavLinkDef {
  href: string;
  icon: LucideIcon;
  label: string;
  badgeKey?: 'cart' | 'messages';
}

// Shared by both roles.
// Note: there is exactly ONE community surface — /app/community is just a
// redirect to the feed — so it gets one nav entry pointing straight at the
// real page rather than two entries racing for the active state.
const COMMON_LINKS: NavLinkDef[] = [
  { href: '/app/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/app/marketplace', icon: Store, label: 'Marketplace' },
  { href: '/app/community/social-feed', icon: Users, label: 'Community' },
  { href: '/app/chat', icon: MessageCircle, label: 'Messages', badgeKey: 'messages' },
  { href: '/app/orders', icon: Receipt, label: 'Orders' },
  { href: '/app/payments', icon: CreditCard, label: 'Payment History' },
  { href: '/app/requests', icon: Clipboard, label: 'Requests' },
];

// Buying is buyer-only (cart/checkout are gated to buyer accounts server-side too).
const BUYER_LINKS: NavLinkDef[] = [
  { href: '/app/favorites', icon: Heart, label: 'Saved Items' },
  { href: '/app/cart', icon: ShoppingCart, label: 'Cart', badgeKey: 'cart' },
];

// Selling to buy requests and managing product photos are seller-only.
const SELLER_LINKS: NavLinkDef[] = [
  { href: '/app/offers', icon: Tag, label: 'My Offers' },
  { href: '/app/media', icon: ImagePlus, label: 'Media Library' },
];

const ACCOUNT_LINKS: NavLinkDef[] = [
  { href: '/app/profile', icon: UserCircle, label: 'My Profile' },
  { href: '/app/community/my-posts', icon: Newspaper, label: 'My Posts' },
  { href: '/app/reviews', icon: Star, label: 'My Reviews' },
  { href: '/app/support', icon: HelpCircle, label: 'Help & Support' },
  { href: '/app/contact', icon: Mail, label: 'Contact Us' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
];

const BUYER_BOTTOM_LINKS: NavLinkDef[] = [
  { href: '/app/community/social-feed', icon: Users, label: 'Feed' },
  { href: '/app/marketplace', icon: Store, label: 'Market' },
  { href: '/app/cart', icon: ShoppingCart, label: 'Cart', badgeKey: 'cart' },
  { href: '/app/chat', icon: MessageCircle, label: 'Chat', badgeKey: 'messages' },
  { href: '/app/orders', icon: Receipt, label: 'Orders' },
];

const SELLER_BOTTOM_LINKS: NavLinkDef[] = [
  { href: '/app/community/social-feed', icon: Users, label: 'Feed' },
  { href: '/app/marketplace', icon: Store, label: 'Market' },
  { href: '/app/offers', icon: Tag, label: 'Offers' },
  { href: '/app/chat', icon: MessageCircle, label: 'Chat', badgeKey: 'messages' },
  { href: '/app/orders', icon: Receipt, label: 'Orders' },
];

// --- Markt Business ---------------------------------------------------------
// Which of these show is decided by the backend's business config and by
// which Markt accounts the user has (selling needs a seller account), never
// by a flag kept here.
export interface BusinessNavOptions {
  /** Business mode is switched on in the backend. */
  enabled: boolean;
  /** The user's remembered mode; business pages override it. */
  mode: AppMode;
  discovery: boolean;
  procurement: boolean;
  subscriptions: boolean;
  canSell: boolean;
}

function businessLinks(opts: BusinessNavOptions): NavLinkDef[] {
  return [
    { href: '/app/business', icon: LayoutDashboard, label: 'Business Dashboard' },
    ...(opts.discovery ? [{ href: '/app/business/discover', icon: Search, label: 'Discover' }] : []),
    ...(opts.canSell ? [{ href: '/app/business/products', icon: Package, label: 'Products' }] : []),
    ...(opts.procurement ? [{ href: '/app/business/procurement', icon: ClipboardList, label: 'Procurement' }] : []),
    { href: '/app/orders', icon: Receipt, label: 'Orders' },
    { href: '/app/chat', icon: MessageCircle, label: 'Messages', badgeKey: 'messages' },
    { href: '/app/business/profile', icon: Building2, label: 'Business Profile' },
    ...(opts.subscriptions ? [{ href: '/app/business/subscription', icon: Crown, label: 'Subscription' }] : []),
  ];
}

function businessBottomLinks(opts: BusinessNavOptions): NavLinkDef[] {
  return [
    { href: '/app/business', icon: LayoutDashboard, label: 'Business' },
    ...(opts.discovery ? [{ href: '/app/business/discover', icon: Search, label: 'Discover' }] : []),
    ...(opts.procurement ? [{ href: '/app/business/procurement', icon: ClipboardList, label: 'Requests' }] : []),
    { href: '/app/chat', icon: MessageCircle, label: 'Chat', badgeKey: 'messages' },
    { href: '/app/orders', icon: Receipt, label: 'Orders' },
  ];
}

/** Business nav shows when business mode is on and the user is in it. */
export function useInBusinessMode(business: BusinessNavOptions): boolean {
  const pathname = usePathname();
  return business.enabled && effectiveMode(business.mode, pathname) === 'business';
}

interface NavProps {
  cartCount: number;
  messageCount: number;
  isSeller: boolean;
  business: BusinessNavOptions;
}

/**
 * Returns the single href that should read as active — the LONGEST one that
 * matches. Plain `startsWith` lights up every ancestor, so a nested route
 * like /app/community/social-feed would highlight both itself and any
 * /app/community entry. Longest-match keeps exactly one lit no matter how
 * nav routes nest in future.
 */
function activeHref(rawPathname: string, hrefs: string[]): string | null {
  // Listing and business-profile pages are reached from Discover and have no
  // nav entry of their own; without this they'd light up the dashboard.
  const pathname = /^\/app\/business\/(listings|businesses)\//.test(rawPathname) ? '/app/business/discover' : rawPathname;
  let best: string | null = null;
  for (const href of hrefs) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      if (best === null || href.length > best.length) best = href;
    }
  }
  return best;
}

function badgeValue(def: NavLinkDef, counts: Record<'cart' | 'messages', number>) {
  return def.badgeKey ? counts[def.badgeKey] : 0;
}

export function SidebarNav({ cartCount, messageCount, isSeller, business }: NavProps) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getSidebarServerSnapshot);
  const inBusiness = useInBusinessMode(business);
  const counts = { cart: cartCount, messages: messageCount };
  const primaryLinks = inBusiness ? businessLinks(business) : [...COMMON_LINKS, ...(isSeller ? SELLER_LINKS : BUYER_LINKS)];
  // Resolved across primary AND account links together, so the two groups
  // can't each light up an entry for the same page.
  const active = activeHref(pathname, [...primaryLinks, ...ACCOUNT_LINKS].map((l) => l.href));

  return (
    <nav className={styles.nav}>
      {primaryLinks.map((def) => {
        const badge = badgeValue(def, counts);
        return (
          <Link
            key={def.href}
            href={def.href}
            className={cn(styles.navLink, collapsed && styles.navLinkCollapsed, active === def.href && styles.navLinkActive)}
            title={collapsed ? def.label : undefined}
          >
            <def.icon size={16} />
            {!collapsed && <span>{def.label}</span>}
            {!collapsed && badge > 0 && <span className={styles.navBadge}>{badge}</span>}
            {collapsed && badge > 0 && <span className={styles.navDot} />}
          </Link>
        );
      })}

      <div className={styles.navSection}>
        {!collapsed && <p className={styles.navSectionTitle}>Account</p>}
        {ACCOUNT_LINKS.map((def) => (
          <Link
            key={def.href}
            href={def.href}
            className={cn(styles.navLink, collapsed && styles.navLinkCollapsed, active === def.href && styles.navLinkActive)}
            title={collapsed ? def.label : undefined}
          >
            <def.icon size={16} />
            {!collapsed && <span>{def.label}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function BottomNav({ cartCount, messageCount, isSeller, business }: NavProps) {
  const pathname = usePathname();
  const inBusiness = useInBusinessMode(business);
  const counts = { cart: cartCount, messages: messageCount };
  const links = inBusiness ? businessBottomLinks(business) : isSeller ? SELLER_BOTTOM_LINKS : BUYER_BOTTOM_LINKS;
  const active = activeHref(pathname, links.map((l) => l.href));

  return (
    <nav className={styles.bottomNav}>
      {links.map((def) => {
        const badge = badgeValue(def, counts);
        return (
          <Link key={def.href} href={def.href} className={cn(styles.bottomNavLink, active === def.href && styles.bottomNavLinkActive)}>
            <def.icon size={18} />
            <span>{def.label}</span>
            {badge > 0 && <span className={styles.badge}>{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
