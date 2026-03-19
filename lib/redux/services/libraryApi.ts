import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import {
    Book,
    Author,
    BorrowedBook,
    SessionUser,
    ApiResponse,
    ApiReturnResponse,
    UserProfile,
    AuthorBooks,
} from "../../db/types"
import { setCredentials, logout } from "../slices/authSlice"
import { RootState } from "../store"

const baseQuery = fetchBaseQuery({
    baseUrl: "/",
    // Ensure Bearer token is sent with every request
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth?.accessToken
        if (token) {
            headers.set("Authorization", `Bearer ${token}`)
        }
        return headers
    }
})

// Module-level variable to hold the ongoing refresh promise for deduplication
let refreshInProgress: Promise<any> | null = null

const PUBLIC_AUTH_ENDPOINTS = [
    "api/auth/login",
    "api/auth/signup",
    "api/auth/logout",
    "api/auth/refresh",
]

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    // Determine the URL
    // For GET requests, args can be a string (URL)
    // For POST/PATCH/DELETE requests, args is an object with a url property
    const url = typeof args === "string" ? args : args.url

    let result = await baseQuery(args, api, extraOptions)

    // Skip re-auth for auth endpoints (refresh, login, signup, logout)
    if (PUBLIC_AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint))) {
        return result
    }

    if (result.error && result.error.status === 401) {
        // This is like ONCE concept in Functional Programming
        // The first request that encounters 401 will trigger the refresh
        // Subsequent requests will wait for the refresh to complete
        // So for the very first request, refreshInProgress will be null
        // For the subsequent requests, refreshInProgress will be the promise of the first request
        // Others request will not be fetched by guarding this if condition
        if (!refreshInProgress) {
            refreshInProgress = baseQuery(
                { url: "api/auth/refresh", method: "POST" },
                api,
                extraOptions
            ) as Promise<any>
        }

        // Even three refresh requests, only one will be processed
        const refreshResult = await refreshInProgress

        // Clear the promise after it finishes so subsequent 401s can trigger it again if needed
        // We use a small timeout to ensure all concurrent requests that are waiting
        // have had a chance to continue before we allow a new refresh.
        if (refreshInProgress) {
            refreshInProgress = null
        }

        if (refreshResult.data) {
            const data = refreshResult.data as any
            // Set credentials in the store for re-authentication
            api.dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))

            // Retry the original query
            result = await baseQuery(args, api, extraOptions)
        } else {
            api.dispatch(logout())
            // window.location.href = "/auth/login"
            console.log("Refresh token expired:", refreshResult.error)
        }
    }
    return result
}

export const libraryApi = createApi({
    reducerPath: "libraryApi",
    baseQuery: baseQueryWithReauth,
    keepUnusedDataFor: 60, // global default 60s
    // refetchOnFocus: true,
    // refetchOnReconnect: true,
    tagTypes: ["Book", "BorrowedBook", "User"],
    endpoints: (builder) => ({
        // Books
        getBooks: builder.query<Book[], void>({
            query: () => "api/books",
            transformResponse: (response: ApiReturnResponse<Book[]>) => response.data,
            keepUnusedDataFor: 3600, // keep cache for 1 hour even after books page unmount
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "Book" as const, id })),
                        { type: "Book", id: "LIST" },
                    ]
                    : [{ type: "Book", id: "LIST" }],
        }),
        getBookById: builder.query<Book, string>({
            query: (id) => `api/books/${id}`,
            transformResponse: (response: ApiReturnResponse<Book>) => response.data,
            providesTags: (result, error, id) => [{ type: "Book", id }],
        }),
        getAuthors: builder.query<Author[], void>({
            query: () => "api/authors",
            transformResponse: (response: ApiReturnResponse<Author[]>) =>
                response.data,
        }),
        getAuthorById: builder.query<AuthorBooks, string>({
            query: (id) => `api/authors/${id}`,
            transformResponse: (response: ApiReturnResponse<AuthorBooks>) => response.data,
        }),
        getBooksByAuthorId: builder.query<Book[], string>({
            query: (id) => `api/authors/${id}/books`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "Book" as const, id })),
                        { type: "Book", id: "AUTHOR_LIST" },
                    ]
                    : [{ type: "Book", id: "AUTHOR_LIST" }],
        }),


        // Borrowing
        borrowBook: builder.mutation<ApiReturnResponse<BorrowedBook>, { bookId: string; userId: string; authorId: string; dueDate: string }>({
            query: (body) => ({
                url: "api/borrow",
                method: "POST",
                body,
            }),
            invalidatesTags: (result, error, { bookId }) => [
                { type: "Book", id: bookId }, // Invalidate specific book
                { type: "Book", id: "LIST" }, // Invalidate all books
                { type: "BorrowedBook", id: "LIST" }, // Invalidate user's borrowed list
            ],
        }),
        returnBook: builder.mutation<ApiReturnResponse<BorrowedBook>, { borrowId: string, userId: string | null }>({
            query: (body) => ({
                url: "api/return",
                method: "PATCH",
                body,
            }),
            // invalidatesTags: (result, error, { borrowId }) => [
            //     { type: "BorrowedBook", id: borrowId },
            //     { type: "BorrowedBook", id: "LIST" },
            // ],

            // Optimistic update
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    libraryApi.util.updateQueryData(
                        "getBorrowedBooksByUserId",
                        arg.userId || "",
                        (draft) => {
                            const index = draft.findIndex(
                                (borrowedBook) => borrowedBook.id === arg.borrowId
                            )
                            if (index !== -1) {
                                draft[index].returned_at = new Date().toISOString()
                                draft[index].status = "returned"
                            }
                        }
                    )
                )
                try {
                    await queryFulfilled
                } catch (err) {
                    patchResult.undo()
                }
            },
        }),
        getBorrowedBooksByUserId: builder.query<BorrowedBook[], string>({
            query: (userId) => `api/borrow/user/${userId}`,
            transformResponse: (response: ApiReturnResponse<BorrowedBook[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "BorrowedBook" as const, id })),
                        { type: "BorrowedBook", id: "LIST" },
                    ]
                    : [{ type: "BorrowedBook", id: "LIST" }],
        }),
        getAllBorrowRecords: builder.query<BorrowedBook[], void>({
            query: () => "api/admin/borrow",
            transformResponse: (response: ApiReturnResponse<BorrowedBook[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "BorrowedBook" as const, id })),
                        { type: "BorrowedBook", id: "LIST" },
                    ]
                    : [{ type: "BorrowedBook", id: "LIST" }],
        }),
        getAllBooksByStatus: builder.query<BorrowedBook[], string>({
            query: (status) => `api/admin/borrow/status/${status}`,
            transformResponse: (response: ApiReturnResponse<BorrowedBook[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "BorrowedBook" as const, id })),
                        { type: "BorrowedBook", id: "LIST" },
                    ]
                    : [{ type: "BorrowedBook", id: "LIST" }],
        }),
        checkBookBorrowed: builder.query<BorrowedBook | null, string>({
            query: (bookId) => `api/borrow/check/${bookId}`,
            transformResponse: (response: ApiReturnResponse<BorrowedBook | null>) => response.data,
            providesTags: [{ type: "BorrowedBook", id: "LIST" }],
        }),

        // Auth
        login: builder.mutation<ApiResponse<SessionUser>, { email: string; password: string }>({
            query: (credentials) => ({
                url: "api/auth/login",
                method: "POST",
                body: credentials,
            }),
            // transformResponse: (response: { success: boolean; user: SessionUser }) => response.user,
            // Use onQueryStarted to dispatch setCredentials
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))
                } catch (err) {
                    // Login failed
                }
            },
        }),
        signUp: builder.mutation<ApiResponse<SessionUser>, { username: string; email: string; hashedPassword: string }>({
            query: (credentials) => ({
                url: "api/auth/signup",
                method: "POST",
                body: credentials,
            }),
            // transformResponse: (response: { success: boolean; user: SessionUser }) => response.user,
            // Use onQueryStarted to dispatch setCredentials
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))
                } catch (err) {
                    // Sign up failed
                }
            },
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "api/auth/logout",
                method: "POST",
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled
                    dispatch(logout())
                } catch (err) { }
            },
        }),
        refresh: builder.mutation<ApiResponse<SessionUser>, void>({
            query: () => ({
                url: "api/auth/refresh",
                method: "POST",
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))
                } catch (err) {
                    // Refresh failed
                }
            },
        }),

        // Users
        getAllUsers: builder.query<UserProfile[], void>({
            query: () => "api/users",
            transformResponse: (response: ApiReturnResponse<UserProfile[]>) => response.data.filter((user) => !user.is_admin),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "User" as const, id })),
                        { type: "User", id: "LIST" },
                    ]
                    : [{ type: "User", id: "LIST" }],
        }),

        getUserById: builder.query<UserProfile, string>({
            query: (id) => `api/users/${id}`,
            transformResponse: (response: ApiReturnResponse<UserProfile>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        { type: "User" as const, id: result.id },
                        { type: "User", id: "LIST" },
                    ]
                    : [{ type: "User", id: "LIST" }],
        }),
    }),
})

export const {
    useGetBooksQuery,
    useGetBookByIdQuery,
    useGetAuthorsQuery,
    useBorrowBookMutation,
    useReturnBookMutation,
    useGetBorrowedBooksByUserIdQuery,
    useCheckBookBorrowedQuery,
    useGetAllBooksByStatusQuery,
    useGetAllBorrowRecordsQuery,
    useLoginMutation,
    useLogoutMutation,
    useSignUpMutation,
    useGetAuthorByIdQuery,
    useGetBooksByAuthorIdQuery,
    useGetAllUsersQuery,
    useGetUserByIdQuery,
    useRefreshMutation,
} = libraryApi
