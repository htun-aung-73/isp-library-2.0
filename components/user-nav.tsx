"use client"

import { LogOut } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { selectUser, logout as reduxLogout } from "@/lib/redux/slices/authSlice"
import { useLogoutMutation } from "@/lib/redux/services/libraryApi"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  const user = useAppSelector(selectUser)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [logoutApi] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
      dispatch(reduxLogout())
      toast.success("Signed out successfully", {
        classNames: { icon: "text-green-500" }
      })
      router.push("/auth/login")
      router.refresh()
    } catch {
      toast.error("Failed to sign out")
    }
  }

  const initial = user?.username?.charAt(0).toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-border">
            {/* <AvatarImage src={user.avatar_url || ""} alt={user.username || "User"} /> */}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-0 shadow-xl overflow-hidden rounded-xl border-border/50" align="end" forceMount>
        <div className="p-3 bg-linear-to-br from-primary/5 via-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20 bg-background shadow-sm">
              <AvatarFallback className="text-primary font-semibold text-lg">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-2 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
              <p className="text-xs leading-snug text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
        <div className="px-3 py-1">
          <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer rounded-lg font-medium transition-colors">
            <div className="rounded-md bg-red-100 dark:bg-red-900/40 p-1.5 flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </div>
            <span>Log out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
