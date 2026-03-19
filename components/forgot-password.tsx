"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Library, Loader2, ArrowLeft, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
})

export default function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: values.email }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.")
            } else {
                setIsSubmitted(true)
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 bg-background/50 backdrop-blur-sm">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Library className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <Card className="border-border shadow-lg">
                        {isSubmitted ? (
                            <>
                                <CardHeader className="text-center space-y-1">
                                    <div className="flex justify-center mb-2">
                                        <div className="p-3 rounded-full bg-green-500/10">
                                            <Mail className="h-6 w-6 text-green-500" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Check Your Email</CardTitle>
                                    <CardDescription className="leading-relaxed">
                                        If an account with that email exists, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="flex justify-center">
                                    <Link href="/auth/login" className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
                                        <ArrowLeft className="h-3 w-3" />
                                        Back to Sign In
                                    </Link>
                                </CardFooter>
                            </>
                        ) : (
                            <>
                                <CardHeader className="text-center space-y-1">
                                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Forgot Password</CardTitle>
                                    <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="you@example.com" {...field} />
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
                                                        Sending...
                                                    </>
                                                ) : (
                                                    "Send Reset Link"
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
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
