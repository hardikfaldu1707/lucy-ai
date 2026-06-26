import { cn } from "@/lib/utils";

interface AdminTableProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}

export function AdminTableScroll({ children, className, minWidth = "640px" }: AdminTableProps) {
  return (
    <div
      className={cn(
        "-mx-4 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:px-0",
        className,
      )}
    >
      <table className="w-full text-sm content-visibility-auto" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

interface AdminTableHeadProps {
  columns: string[];
}

export function AdminTableHead({ columns }: AdminTableHeadProps) {
  return (
    <thead>
      <tr className="border-b bg-muted/30 text-left text-muted-foreground">
        {columns.map((col) => (
          <th key={col} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface AdminTableSkeletonProps {
  columns: number;
  rows?: number;
}

export function AdminTableSkeleton({ columns, rows = 5 }: AdminTableSkeletonProps) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b last:border-0">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-muted" style={{ width: j === 0 ? "80%" : "60%" }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

interface AdminTableEmptyProps {
  colSpan: number;
  message?: string;
}

export function AdminTableEmpty({ colSpan, message = "No data found." }: AdminTableEmptyProps) {
  return (
    <tbody>
      <tr>
        <td
          className="px-4 py-12 text-center text-sm text-muted-foreground"
          colSpan={colSpan}
        >
          {message}
        </td>
      </tr>
    </tbody>
  );
}
