"use client"

import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { trpc } from "@/trpc/client"
import { DEFAULT_LIMIT } from "@/constants"
import { PlaylistGridCard, PlaylistGridCardSkeleton } from "../components/playlist-grid-card"
import { InfiniteScroll } from "@/components/infinite.scroll"

export const PlaylistsSection = () => {
    return (
        <Suspense fallback={<PlaylistsSectionSkeleton />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <PlaylistsSectionSuspense  />
            </ErrorBoundary>
        </Suspense>
    )
}

export const PlaylistsSectionSkeleton = () => {
    return (
        <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3
            2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 
            [@media(min-width:2200px)]:grid-cols-6">
            {Array.from({ length: 18 }).map((_, index) => (
                <PlaylistGridCardSkeleton key={index} />
            ))
            }
        </div>
    )
}

export const PlaylistsSectionSuspense = () => {
    const [playlists, query] = trpc.playlists.getMany.useSuspenseInfiniteQuery({
        limit: DEFAULT_LIMIT,
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

    return (
        <div>
            <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3
            2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 
            [@media(min-width:2200px)]:grid-cols-6">
                {playlists.pages
                    .flatMap((page) => page.items)
                    .map((playlist) => (
                        <PlaylistGridCard key={playlist.id} data={playlist} />
                    ))}
            </div>
            <InfiniteScroll
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                fetchNextPage={query.fetchNextPage}
            />
        </div>
    )
}
