"use client"

import type React from "react"

import { useCallback, useMemo, useRef, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GridReadyEvent,
  type ValueFormatterParams,
} from "ag-grid-community"

import { Button } from "@/components/ui/button"
import { BookOpen, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useGetBooksQuery } from "@/lib/redux/services/libraryApi"
import { useAppSelector } from "@/lib/redux/hooks"
import { selectUser } from "@/lib/redux/slices/authSlice"
import { Skeleton } from "./ui/skeleton"

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

export function BookAgGrid() {

  const { data: booksData, isError, isLoading } = useGetBooksQuery(undefined)
  const books = booksData

  const user = useAppSelector(selectUser)

  const gridRef = useRef<any>(null)
  const [quickFilterText, setQuickFilterText] = useState("")

  // Column definitions with sorting, filtering
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 3,
        minWidth: 200,
        filter: "agTextColumnFilter",
        sortable: true,
        cellClass: "font-medium text-foreground",
      },
      {
        field: "author_name",
        headerName: "Author",
        minWidth: 120,
        flex: 2,
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params: any) => params.data?.author_name || "Unknown",
      },
      {
        field: "language",
        headerName: "Language",
        minWidth: 130,
        flex: 1,
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params: any) => params.data?.language || "Unknown",
      },
      {
        field: "published_year",
        headerName: "Year",
        minWidth: 100,
        flex: 1,
        filter: "agNumberColumnFilter",
        sortable: true,
        valueFormatter: (params: ValueFormatterParams) => params.value || "N/A",
      },
      {
        field: "publisher_name",
        headerName: "Publisher",
        minWidth: 120,
        flex: 1.5,
        filter: "agTextColumnFilter",
        sortable: true,
        valueFormatter: (params: ValueFormatterParams) => params.value || "N/A",
      },
      {
        field: "place_of_publication",
        headerName: "Place",
        minWidth: 120,
        flex: 1,
        filter: "agTextColumnFilter",
        sortable: true,
        valueFormatter: (params: ValueFormatterParams) => params.value || "N/A",
      },
      {
        field: "class_number",
        headerName: "Class #",
        minWidth: 120,
        flex: 1,
        filter: "agTextColumnFilter",
        sortable: true,
        valueFormatter: (params: ValueFormatterParams) => params.value || "N/A",
      },
      {
        headerName: "Action",
        width: 100,
        flex: 1,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const bookId = params.data?.book_id
          return (
            <Link href={`/books/${bookId}`}>
              <Button variant="ghost" size="sm" className="h-8">
                <Eye className="h-5 w-5 text-primary" /> View
              </Button>
            </Link>
          )
        },
        pinned: "right",
      },
    ],
    [],
  )

  // Default column properties
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      filterParams: {
        buttons: ["reset", "apply"],
      },
      wrapText: true,
      autoHeight: true,
    }),
    [],
  )

  const onFilterTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(e.target.value)
  }, [])

  const exportToCsv = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: "library-books.csv",
    })
  }, [])

  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <div className="w-full space-y-4">
          <Skeleton className="h-9 px-3 rounded-md w-64" />
          <Skeleton className="h-[60vh] w-full rounded-lg mt-8" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error loading books. Please try again.</p>
      </div>
    )
  }

  if (Array.isArray(books) && books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No books found.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Quick search all columns..."
            value={quickFilterText}
            onChange={onFilterTextChange}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-80"
          />
        </div>
        <div className="flex items-center gap-2">
          {
            user?.isAdmin && (
              <Button variant="outline" size="sm" onClick={exportToCsv}>
                Export CSV
              </Button>
            )
          }
          <div className="flex items-center font-bold p-2 rounded text-primary">
            <BookOpen className="mr-2 h-4 w-4" />
            <p>{books!.length} {books!.length > 1 ? "books" : "book"}</p>
          </div>
        </div>
      </div>

      {/* AG Grid */}
      <div
        className="ag-theme-custom rounded-lg border border-border overflow-hidden h-[60vh] xl:h-[65vh] 2xl:h-[70vh]"
        style={{ width: "100%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={books}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={100}
          paginationPageSizeSelector={[50, 100, 200, 500]}
          animateRows={true}
          enableCellTextSelection={true}
          rowHeight={35}
          headerHeight={48}
        />
      </div>
    </div>
  )
}
