'use client'

import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { trpc } from "@/trpc/client"
import { DEFAULT_LIMIT } from "@/constants"
import { VideoRowCard } from "../components/video-row-card"
import { VideoGridCard } from "../components/video-grid-card"
import { InfiniteScroll } from "@/components/infinite.scroll"
import { VideoRowCardSkeleton } from "../components/video-row-card"
import { VideoGridCardSkeleton } from "../components/video-grid-card"
interface SuggestionSectionProps {
    videoId: string
    isManual?: boolean
}

export const SuggestionSection = ({
    videoId,
    isManual
}: SuggestionSectionProps) => {
    return (
        <Suspense fallback={<SuggestionSectionSkeleton />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <SuggestionSectionSuspense videoId={videoId} isManual={isManual} />
            </ErrorBoundary>
        </Suspense>
    )
}

const SuggestionSectionSkeleton = () => {
    return (
        <>
            <div className="hidden mb:block space-y-3">
                {Array.from({length: 6}).map((_, index) => (
                    <VideoRowCardSkeleton key={index} size="compact" />
                ))}
            </div>
            <div className="block md:hidden space-y-10">
                {Array.from({length: 6}).map((_, index) => (
                    <VideoGridCardSkeleton key={index} />
                ))}
            </div>
        </>
    )
}

export const SuggestionSectionSuspense = ({ videoId, isManual }: SuggestionSectionProps) => {
    const [suggestion, query] = trpc.suggestions.getMany.useSuspenseInfiniteQuery({
        videoId,
        limit: DEFAULT_LIMIT
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor
    })
    return (
        <>
            <div className="hidden md:block space-y-3">
                {suggestion.pages.flatMap((page) => page.items.map((video) => (
                    <VideoRowCard
                        key={video.id}
                        data={video}
                        size="compact"
                    />
                )))}
            </div>
            <div className="block md:hidden space-y-10">
                {suggestion.pages.flatMap((page) => page.items.map((video) => (
                    <VideoGridCard
                        key={video.id}
                        data={video}
                    />
                )))}
            </div>
            <InfiniteScroll
                isManual={isManual}
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                fetchNextPage={query.fetchNextPage}
            />
        </>
    )
}
