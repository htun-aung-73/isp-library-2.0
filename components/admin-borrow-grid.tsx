"use client"

import { useMemo, useState, useCallback, useRef } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type { ColDef, GridReadyEvent } from "ag-grid-community"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BorrowedBook } from "@/lib/db/types"

ModuleRegistry.registerModules([AllCommunityModule])

interface AdminBorrowGridProps {
  borrowedBooks: BorrowedBook[]
}

export function AdminBorrowGrid({ borrowedBooks }: AdminBorrowGridProps) {
  const [quickFilterText, setQuickFilterText] = useState("")
  const gridRef = useRef<any>(null)

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "User",
        field: "username",
        filter: "agTextColumnFilter",
        flex: 1.5,
        minWidth: 150,
      },
      {
        headerName: "Email",
        field: "email",
        valueGetter: (params: any) => params.data?.email || "N/A",
        filter: "agTextColumnFilter",
        flex: 1.5,
        minWidth: 180,
      },
      {
        headerName: "Book Title",
        field: "title",
        filter: "agTextColumnFilter",
        flex: 2,
        minWidth: 200,
      },
      {
        headerName: "Author",
        field: "author_name",
        filter: "agTextColumnFilter",
        flex: 1.5,
        minWidth: 150,
      },
      {
        headerName: "Publisher",
        field: "publisher_name",
        filter: "agTextColumnFilter",
        flex: 1.5,
        minWidth: 150,
      },
      {
        headerName: "Status",
        field: "status",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 120,
        valueGetter: (params: any) => {
          const status = params.data?.status
          if (status === "borrowed") {
            const dueDate = params.data?.due_date ? new Date(params.data.due_date) : null
            if (dueDate && dueDate < new Date()) {
              return "overdue"
            }
            return "borrowed"
          }
          return status || "N/A"
        },
        cellRenderer: (params: any) => {
          const status = params.value
          if (status === "overdue") {
            return (
              <div className="flex items-center h-full">
                <Badge variant="destructive" className="gap-1 px-2 py-0.5 font-semibold animate-pulse">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              </div>
            )
          }

          if (status === "borrowed") {
            return (
              <div className="flex items-center h-full">
                <Badge variant="secondary" className="gap-1 px-2 py-0.5 font-semibold bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                  <Clock className="h-3 w-3" />
                  Borrowed
                </Badge>
              </div>
            )
          }

          return (
            <div className="flex items-center h-full">
              <Badge variant="outline" className="gap-1 px-2 py-0.5 font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Returned
              </Badge>
            </div>
          )
        },
      },
      {
        headerName: "Borrowed Date",
        field: "borrowed_at",
        filter: "agDateColumnFilter",
        flex: 1,
        minWidth: 150,
        valueFormatter: (params: any) => {
          if (!params.value) return "N/A"
          return new Date(params.value).toLocaleDateString()
        },
        sort: "desc",
      },
      {
        headerName: "Due Date",
        field: "due_date",
        filter: "agDateColumnFilter",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params: any) => {
          if (!params.value) return "N/A"
          return new Date(params.value).toLocaleDateString()
        },
      },
      {
        headerName: "Returned Date",
        field: "returned_at",
        filter: "agDateColumnFilter",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params: any) => {
          if (!params.value || params.value === "null") return "-"
          return new Date(params.value).toLocaleDateString()
        },
      },
    ],
    [],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filterParams: {
        buttons: ["reset", "apply"],
      },
    }),
    [],
  )

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit()
  }, [])

  const exportToCsv = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: "library-books.csv",
    })
  }, [])

  const customTheme = themeQuartz.withParams({
    backgroundColor: "var(--card)",
    foregroundColor: "var(--card-foreground)",
    headerBackgroundColor: "var(--muted)",
    headerTextColor: "var(--muted-foreground)",
    oddRowBackgroundColor: "var(--card)",
    rowHoverColor: "var(--accent)",
    borderColor: "var(--border)",
    fontFamily: "var(--font-sans)",
    headerFontWeight: 600,
    rowBorder: true,
    wrapperBorder: true,
    wrapperBorderRadius: "0.5rem",
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportToCsv}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="h-150 w-full">
        <AgGridReact
          ref={gridRef}
          theme={customTheme}
          rowData={borrowedBooks}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={50}
          paginationPageSizeSelector={[50, 100, 200, 500]}
          onGridReady={onGridReady}
          animateRows={true}
        />
      </div>
    </div>
  )
}
