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
      <table className="w-full text-sm" style={{ minWidth }}>
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
      <tr className="border-b text-left text-muted-foreground">
        {columns.map((col) => (
          <th key={col} scope="col" className="p-4 font-medium">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}
