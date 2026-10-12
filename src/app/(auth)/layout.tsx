// Authentication workspace layout (login, etc.).
//
// Hybrid rendering — this layout is the STATIC half of the hybrid strategy:
// the login screen has no per-user data, so it reads no cookies and contains no
// request-time API. The whole route prerenders once and is then served as a
// static payload, which is what makes the sign-in page open instantly.
//
// A visitor who is already authenticated never sees this form: the workspace
// layouts verify the session server-side on every request and the role
// dashboards act as the landing page, so nothing here needs the session.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
