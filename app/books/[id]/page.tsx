'use client'
import { BookDetails } from "@/components/book-details"
import { useGetBookByIdQuery, useGetBorrowedBooksByUserIdQuery, useCheckBookBorrowedQuery } from "@/lib/redux/services/libraryApi"
import { notFound, useParams } from "next/navigation"
import BooksLoading from "../loading"
import { useAppSelector } from "@/lib/redux/hooks"
import { selectUser } from "@/lib/redux/slices/authSlice"

export default function BookPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAppSelector(selectUser)

  const { data: book, isLoading: isBookLoading, isError: isBookError } = useGetBookByIdQuery(id, {
    skip: !id,
  })
  const { data: checkBookBorrowed, isLoading: isBookBorrowedLoading, isError: isBookBorrowedError } = useCheckBookBorrowedQuery(book?.book_id || "", {
    skip: !book?.book_id,
    pollingInterval: 3000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true
  })

  const { data: borrowedBooks, isLoading: isBorrowedBooksLoading, isError: isBorrowedBooksError } = useGetBorrowedBooksByUserIdQuery(user?.user_id || "", {
    skip: !user?.user_id,
  })

  const hasBorrowed = borrowedBooks?.some(b => (b.book_id === book?.book_id) && (b.status === "borrowed"))
  const currentBorrowedByUser = borrowedBooks?.filter(b => b.status === "borrowed").length || 0
  const borrowedBooksByBookId = borrowedBooks?.filter(b => b.book_id === book?.book_id)

  if (isBookLoading || isBookBorrowedLoading || isBorrowedBooksLoading) {
    return (
      <BooksLoading />
    )
  }

  if (isBookError || isBookBorrowedError || isBorrowedBooksError) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-destructive mb-4">Error loading book</p>
      </div>
    )
  }

  if (!book && !isBookLoading && !isBookBorrowedLoading && !isBorrowedBooksLoading) {
    notFound()
  }

  return (
    <BookDetails
      book={book}
      borrowedBook={Array.isArray(borrowedBooksByBookId) && borrowedBooksByBookId?.length > 0 ? borrowedBooksByBookId?.[0] : null}
      checkBookBorrowed={checkBookBorrowed}
      hasBorrowed={hasBorrowed || false}
      currentBorrowedByUser={currentBorrowedByUser}
      user={user}
    />
  )
}

