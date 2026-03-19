"use client"
import { useMemo, useState } from "react"
import { Skeleton } from "./ui/skeleton"
import { ArrowRight, BookOpen, Search, User } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { useGetAllUsersQuery } from "@/lib/redux/services/libraryApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function UsersDetails() {
    const { data: users, isLoading, isError } = useGetAllUsersQuery()
    const [searchTerm, setSearchTerm] = useState("")

    const filteredUsers = useMemo(() => {
        if (!users) return []

        return users.filter((user) =>
            searchTerm ? user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) : true
        )
    }, [users, searchTerm])

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-full md:w-80 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
                <p className="text-muted-foreground text-lg">Failed to load users. Please try again later.</p>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Active Users</h1>
                    <p className="flex items-center gap-2 text-muted-foreground text-base">Keep track of our active users:
                        <span className="p-2 w-10 h-10 rounded-full text-center font-bold text-white bg-destructive/90 shadow-sm">{users?.length || 0}</span>
                    </p>
                </div>
                <div className="relative w-full lg:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search users..."
                        className="pl-12 rounded-full h-12 border-border/60 bg-muted/30 focus-visible:ring-primary/20 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.length > 0 && filteredUsers.map((user) => (
                    <Link key={user.user_id} href={`/admin/details/users/${user.user_id}`}>
                        <Card className="group relative h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden bg-card/50 backdrop-blur-sm">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 border-2 border-primary/10 group-hover:border-amber-600/50 transition-all">
                                        <AvatarFallback className="bg-amber-600 text-secondary-foreground">
                                            <User className="h-7 w-7" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <CardTitle className="text-sm font-semibold transition-colors leading-6">
                                            {user.username}
                                        </CardTitle>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
                                            <BookOpen className="h-3.5 w-3.5 text-destructive" />
                                            <span>{user.borrow_books?.length || 0} {user.borrow_books?.length === 1 ? "Book" : "Books"}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                    <span className="text-xs font-bold text-black/80 uppercase tracking-widest">View Profile</span>
                                    <div className="p-2 rounded-full bg-primary/5 group-hover:bg-destructive/80 group-hover:text-white transition-all">
                                        <ArrowRight className="h-4 w-4 transition-transform" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-24 border-2 border-dashed rounded-3xl">
                    <User className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-bold">No Users found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms</p>
                    <Button
                        variant="outline"
                        className="mt-2 text-primary"
                        onClick={() => setSearchTerm("")}
                    >
                        Clear search
                    </Button>
                </div>
            )}
        </div>
    )
}