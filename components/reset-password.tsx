"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
    password: z.string().min(8, {
        message: "Password must be at least 8 characters long.",
    }),
    confirmPassword: z.string().min(8, {
        message: "Password must be at least 8 characters long.",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
})

export default function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    if (!token) {
        return (
            <Card className="border-border shadow-lg">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Invalid Link</CardTitle>
                    <CardDescription>
                        This password reset link is invalid or has expired. Please request a new one.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
                        Request New Link
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: values.password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.")
            } else {
                setIsSuccess(true)
                toast.success("Password reset successful!", {
                    classNames: { icon: "text-green-500" }
                })
                setTimeout(() => router.push("/auth/login"), 2000)
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="border-border shadow-lg">
                <CardHeader className="text-center space-y-1">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-full bg-green-500/10">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Password Reset</CardTitle>
                    <CardDescription className="leading-relaxed">
                        Your password has been reset successfully. Redirecting to sign in...
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="border-border shadow-lg">
            <CardHeader className="text-center space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Reset Password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {error && (
                            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/auth/login" className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Back to Sign In
                </Link>
            </CardFooter>
        </Card>
    )
}
