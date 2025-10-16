import { ReactNode } from 'react'

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => ReactNode)
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
}

export default function DataTable<T>({ data, columns, keyExtractor, emptyMessage = 'No data available' }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="admin-table-empty">
        <p className="admin-table-empty-text">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column, idx) => (
                <th key={idx}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)}>
                {columns.map((column, idx) => (
                  <td key={idx} className={column.className || ''}>
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor as keyof T] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
