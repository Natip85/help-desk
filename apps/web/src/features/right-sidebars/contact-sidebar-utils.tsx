export function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

export function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">{text}</div>
  );
}

export function formatCompactDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
