import { cn } from '@/lib/utils'

interface Column<T> {
  key: string; header: string; width?: string
  render?: (row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]; data: T[]
  onRowClick?: (row: T) => void; emptyMessage?: string
}

export function Table<T extends Record<string, any>>({ columns, data, onRowClick, emptyMessage = 'No data' }: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }}
                className="text-left text-[10px] text-ink3 uppercase tracking-wider font-semibold px-3 py-2 border-b border-border">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-10 text-ink3 text-sm">{emptyMessage}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}
                onClick={() => onRowClick?.(row)}
                className={cn('border-b border-border last:border-b-0', onRowClick && 'hover:bg-surface2 cursor-pointer transition-colors')}>
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-2.5 text-[13px] align-middle">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
