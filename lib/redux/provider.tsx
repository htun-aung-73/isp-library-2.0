"use client"

import { useRef } from "react"
import { Provider } from "react-redux"
import { makeStore, AppStore } from "./store"
import { hydrate } from "./slices/authSlice"
import { SessionUser } from "../db/types"
import { setupListeners } from "@reduxjs/toolkit/query"
export default function ReduxProvider({
    children,
    user,
}: {
    children: React.ReactNode
    user: SessionUser | null
}) {
    const storeRef = useRef<AppStore | null>(null)
    if (!storeRef.current) {
        storeRef.current = makeStore()
        setupListeners(storeRef.current.dispatch) // setup listeners for refetch on focus, reconnect, etc.
        // Hydrate the store with the initial user session
        if (user) {
            storeRef.current.dispatch(hydrate({ user }))
        }
    }

    return (
        <Provider store={storeRef.current}>
            {children}
        </Provider>
    )
}