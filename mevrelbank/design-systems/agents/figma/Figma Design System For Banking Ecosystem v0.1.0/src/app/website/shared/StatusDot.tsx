export function StatusDot({ status }: { status: string }) {
  const c: Record<string, string> = { completed: "#0E7C4D", pending: "#B46A0A", failed: "#C52B2B" };
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c[status] ?? "#B8C5DD" }} />;
}
