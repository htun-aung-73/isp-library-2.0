"use client"

import { Card, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Eye, Calendar, Globe, Library, User, Book, MapPinCheckInside } from "lucide-react"
import Link from "next/link"
import { useGetAuthorByIdQuery } from "@/lib/redux/services/libraryApi"
import { Skeleton } from "./ui/skeleton"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"


interface AuthorBooksProps {
    authorId: string
}

export function AuthorBooks({ authorId }: AuthorBooksProps) {
    const { data: author, isLoading: isAuthorLoading, isError } = useGetAuthorByIdQuery(authorId)
    const books = author?.books

    if (isAuthorLoading) {
        return (
            <div className="space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                <p className="text-muted-foreground">Error loading books for this author.</p>
            </div>
        )
    }

    if (books?.length === 0) {
        return (
            <div className="space-y-6 text-center py-12 border-2 border-dashed rounded-xl">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <div>
                    <h2 className="text-xl font-semibold">{author?.name || "Author"}</h2>
                    <p className="text-muted-foreground">Currently has no books in our collection.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/books">Browse Other Books</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            {/* Author Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b border-border/60">
                <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                        <User className="h-10 w-10" />
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left space-y-2 self-center">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-foreground">
                            {author?.name || "Author"}
                        </h1>
                        <Badge variant="default" className="w-fit mx-auto md:mx-0 font-bold px-3 py-1">
                            {books?.length || 0} {books?.length === 1 ? "Publication" : "Publications"}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Explore all books by this author below.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {books?.map((book) => (
                    <Card key={book.id} className="group overflow-hidden flex flex-row h-full transition-all duration-300 shadow-xs hover:shadow-sm border-border/40">
                        {/* Visual sidebar */}
                        <div className="w-2 bg-primary/20 group-hover:bg-primary transition-colors shrink-0" />

                        <div className="flex-1 flex flex-row items-center p-6 gap-6">
                            <div className="flex-1 min-w-0 space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest opacity-80">
                                        <Library className="h-3 w-3" />
                                        <span>Catalog Record</span>
                                    </div>
                                    <CardTitle className="leading-8 font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                        {book.title}
                                    </CardTitle>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <Globe className="h-3.5 w-3.5 opacity-60" />
                                        <span className="truncate">{book.language || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                                        <span>{book.published_year || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <Book className="h-3.5 w-3.5 opacity-60" />
                                        <span>{book.publisher_name || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <MapPinCheckInside className="h-3.5 w-3.5 opacity-60" />
                                        <span>{book.place_of_publication || "Unknown"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 border-l border-border/50 pl-6 h-full flex items-center">
                                <Button asChild variant="ghost" className="rounded-full h-12 w-12 p-0 group/btn hover:bg-primary dark:hover:bg-primary/80 hover:text-white border border-transparent transition-all">
                                    <Link href={`/books/${book.book_id}`} title="View Details">
                                        <Eye className="h-6 w-6" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
