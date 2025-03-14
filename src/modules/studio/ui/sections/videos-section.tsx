'use client'

import Link from "next/link"
import { Suspense } from "react"
import { trpc } from "@/trpc/client"
import { format } from "date-fns"
import { ErrorBoundary } from "react-error-boundary"
import { snakeCaseToTitle } from "@/lib/utils"
import { DEFAULT_LIMIT } from '@/constants'
import { InfiniteScroll } from "@/components/infinite.scroll"
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail"
import { Globe2Icon, LockIcon } from "lucide-react" 
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

export const VideosSection = () => {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <VideosSectionSuspense />
            </ErrorBoundary>
        </Suspense>
    )
}

const VideosSectionSuspense = () => {
    const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery({
        limit: DEFAULT_LIMIT,
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    }) 
    
    return (
        <div>
            <div className="border-y">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6 w-[510px]">Video</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">Comments</TableHead>
                            <TableHead className="text-right pr-6">Likes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {videos.pages.flatMap((page) => page.items).map((video) => (
                            <Link href={`/studio/videos/${video.id}`} key={video.id} legacyBehavior>
                                <TableRow className="cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="relative aspect-video w-36 shrink-0">
                                                <VideoThumbnail
                                                    title={video.title}
                                                    duration={video.duration || 0}
                                                    thumbnailUrl={video.thumbnailUrl} 
                                                    previewUrl={video.previewUrl} 
                                                />
                                            </div>
                                            <div className="flex flex-col overflow-hidden gap-y-1">
                                                <span className="text-sm line-clamp-1">{video.title}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {video.description || "No description"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            {video.visibility === 'private' ? (
                                                <LockIcon className="size-4 mr-2" />
                                            ) : (
                                                <Globe2Icon className="size-4 mr-2" />
                                            )}
                                            {snakeCaseToTitle(video.visibility)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            {snakeCaseToTitle(video.muxStatus || "Error")}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm truncate">
                                        {format(new Date(video.createdAt), "yyyy-MM-dd")}
                                    </TableCell>
                                    <TableCell>
                                        Views
                                    </TableCell>
                                    <TableCell>
                                        Comments
                                    </TableCell>
                                    <TableCell>
                                        Likes
                                    </TableCell>
                                </TableRow>
                            </Link>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <InfiniteScroll
                isManual
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                fetchNextPage={query.fetchNextPage}
            />
        </div>
    )
}