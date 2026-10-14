/** Light route transition (CSS only, so it never hides server-rendered content). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
