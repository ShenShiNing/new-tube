import Image from "next/image"
import { formatDuration } from "@/lib/utils"
import { THUMBNAIL_FALLBACK } from "../../constants"
import { Skeleton } from "@/components/ui/skeleton"

interface VideoThumbnailProps {
    title: string,
    duration: number
    thumbnailUrl?: string | null,
    previewUrl?: string | null,
}

export const VideoThumbnailSkeleton = () => {
    return (
        <div className="relative w-full overflow-hidden rounded-xl aspect-video">
            <Skeleton className="size-full" />
        </div>
    )
}

export const VideoThumbnail = ({
    title,
    duration,
    thumbnailUrl,
    previewUrl
}: VideoThumbnailProps) => {
    return (
        <div className="relative group">
            {/* Thumbnail wrapper */}
            <div className="relative w-full overflow-hidden rounded-xl aspect-video">
                <Image
                    fill
                    src={thumbnailUrl ?? THUMBNAIL_FALLBACK}
                    alt={title}
                    className="h-full w-full object-cover group-hover:opacity-0"
                />
                <Image
                    unoptimized={!!previewUrl}
                    fill
                    src={previewUrl ?? THUMBNAIL_FALLBACK}
                    alt={title}
                    className="h-full w-full object-cover opacity-0 group-hover:opacity-100"
                />
            </div>

            {/* Video duration box */}
            <div className="absolute bottom-2 right-2 px-1 py-0.5 roubnded bg-black/80 text-white text-sm
            font-medium">
                {formatDuration(duration)}
            </div>
        </div>
    )
}