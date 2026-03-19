'use client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Library } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SignUpSuccessPage() {
  const router = useRouter()
  toast.success('Sign up success!', {
    classNames: {
      icon: 'text-green-500',
    }
  })
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center">
            <Library className="h-12 w-12 text-primary" />
          </div>
          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Sign Up Success</CardTitle>
              <CardDescription>Welcome to the ISP Library</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                We have thousands of books for you to borrow and, we offer easy and smart browsing experience. You can start borrowing books now.
              </p>
              <div className="flex justify-center mt-4">
                <Button
                  className="w-full"
                  onClick={() => router.push('/books')}
                >
                  Start Borrowing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
