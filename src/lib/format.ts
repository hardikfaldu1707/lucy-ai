const adminDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const adminDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatAdminDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return adminDateFormatter.format(date);
}

export function formatAdminDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return adminDateTimeFormatter.format(date);
}
