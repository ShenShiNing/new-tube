'use client'
// ^-- to make sure we can mount the Provider from a server component
import { useState } from 'react'
import superjson from 'superjson'
import type { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"

import { APP_URL } from "@/constants"
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { makeQueryClient } from "./query-client"
import type { AppRouter } from './routers/_app'

export const trpc = createTRPCReact<AppRouter>()

let clientQueryClientSingleton: QueryClient
function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a query client
        return makeQueryClient()
    }
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= makeQueryClient())
}

function getUrl() {
    const base = (() => {
        if (typeof window === 'undefined') return ''
        // TODO: Modify for outside-Vercel deployment
        if (APP_URL) return `https://${APP_URL}`
        return 'http://localhost:3000'
    })();
    return `${base}/api/trpc`
}

export function TRPCProvider(
    props: Readonly<{
        children: React.ReactNode
    }>
) {
    // NOTE: Avoid useState when initializing the query client if you don't
    //       have a suspense boundary between this and the code that may
    //       suspend because React will throw away client on the initial
    //       render if it suspends and there is no boundary
    const queryClient = getQueryClient()

    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    transformer: superjson,
                    url: getUrl(),
                    async headers() {
                        const headers = new Headers();
                        headers.set('x-trpc-source', 'nextjs-react')
                        return headers
                    }
                })
            ]
        })
    )

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {props.children}
            </QueryClientProvider>
        </trpc.Provider>
    )
}