"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, User } from "lucide-react"
import Link from "next/link"
import { useGetAllUsersQuery, useGetUserByIdQuery } from "@/lib/redux/services/libraryApi"
import { Skeleton } from "./ui/skeleton"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { MyBooksContent } from "./my-books-content"
import { LibraryCard } from "./library-card"
import { useGetBorrowedBooksByUserIdQuery } from "@/lib/redux/services/libraryApi"
import { Badge } from "./ui/badge"


interface UserBooksProps {
    userId: string
}

export function UserBooks({ userId }: UserBooksProps) {
    const { data: books, isLoading, isError } = useGetBorrowedBooksByUserIdQuery(userId, {
        skip: !userId,
        pollingInterval: 3000,
        skipPollingIfUnfocused: true,
        refetchOnFocus: true,
    })
    // const { data: user } = useGetUserByIdQuery(userId, {
    //     skip: !userId,
    // })

    // To optimize and reduce unnecessary API calls, we use selectFromResult to select from the cached data
    // instead of making a new API call for each user
    const { user } = useGetAllUsersQuery(undefined, {
        selectFromResult: ({ data }) => ({
            user: data?.find((user) => user.user_id === userId),
        }),
    })

    const borrowed = books?.filter((book) => book.status === "borrowed")
    const overDue = borrowed?.filter((book) => new Date(book.due_date) < new Date())
    const returned = books?.filter((book) => book.status === "returned")

    if (isLoading) {
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
                <p className="text-muted-foreground">Error loading books for this user.</p>
            </div>
        )
    }

    if (books?.length === 0) {
        return (
            <div className="space-y-6 text-center py-12 border-2 border-dashed rounded-xl">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <div>
                    <h2 className="text-xl font-semibold">{user?.username || "User"}</h2>
                    <p className="text-muted-foreground">This user has not borrowed any books yet.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/admin/details/users">See Other Users</Link>
                </Button>
            </div>
        )
    }
    return (
        <div>
            {/* User Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8">
                <Avatar className="h-24 w-24 border-4 border-amber-500/60 shadow-lg shrink-0">
                    <AvatarFallback className="bg-amber-600 text-primary-foreground text-xl font-bold">
                        <User className="h-10 w-10" />
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left space-y-2 self-center">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-foreground">
                            {user?.username || "User"}
                        </h1>
                        <Badge variant="default" className="bg-amber-700 w-fit mx-auto md:mx-0 font-bold px-3 py-1">
                            {`${borrowed?.length || 0} Borrowed`}
                        </Badge>
                        <Badge variant="destructive" className="w-fit mx-auto md:mx-0 font-bold px-3 py-1">
                            {`${overDue?.length || 0} Overdue`}
                        </Badge>
                        <Badge variant="default" className="w-fit mx-auto md:mx-0 font-bold px-3 py-1">
                            {`${returned?.length || 0} Returned`}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Track and Management all books by this user below.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <MyBooksContent borrowed={borrowed || []} overDue={overDue || []} returned={returned || []} />
                </div>
                <div className="lg:col-span-1">
                    <LibraryCard
                        user={user}
                        borrowedCount={borrowed?.length || 0}
                        memberSince={user?.created_at || new Date().toISOString()}
                    />
                </div>
            </div>
        </div>
    )
}
