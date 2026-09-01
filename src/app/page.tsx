import { redirect } from 'next/navigation';

/**
 * The root URL sends people straight into the app rather than showing the
 * marketing landing page. Signed-in visitors land on their dashboard;
 * signed-out visitors are forwarded to /auth/login by the /app auth guard
 * (requireSession). The marketing landing page still lives at /welcome.
 */
export default function RootPage() {
  redirect('/app/dashboard');
}
