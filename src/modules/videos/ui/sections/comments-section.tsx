'use client'

import { DEFAULT_LIMIT } from "@/constants"

import { trpc } from "@/trpc/client"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { Loader2Icon } from "lucide-react"
import { CommentForm } from "@/modules/comments/ui/components/comment-form"
import { CommentItem } from "@/modules/comments/ui/components/comment-item"
import { InfiniteScroll } from "@/components/infinite.scroll"

interface CommentsSectionProps {
    videoId: string
}

export const CommentsSection = ({ videoId }: CommentsSectionProps) => {
    return (
        <Suspense fallback={<CommentSkeleton />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <CommentsSectionSuspense videoId={videoId} />
            </ErrorBoundary>
        </Suspense>
    )
}

export const CommentSkeleton = () => {
    return (
        <div className="mt-6 flex justify-center items-center">
            <Loader2Icon className="text-muted-foreground animate-spin" />
        </div>
    )
}

export const CommentsSectionSuspense = ({ videoId }: CommentsSectionProps) => {
    const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery({
        videoId,
        limit: DEFAULT_LIMIT
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor
    })

    return (
        <div className="mt-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6">
                    <h1 className="text-xl font-bold">
                        {comments.pages[0].totalCount} Comments
                    </h1>
                </div>
                <CommentForm videoId={videoId} />
            </div>
            <div className="flex flex-col gap-4 mt-2">
                {comments.pages.flatMap((page) => page.items).map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                    />
                ))}
                <InfiniteScroll
                    isManual
                    hasNextPage={query.hasNextPage}
                    isFetchingNextPage={query.isFetchingNextPage}
                    fetchNextPage={query.fetchNextPage}
                />
            </div>
        </div>
    )
}