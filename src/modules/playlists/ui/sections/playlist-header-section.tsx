'use client'

import { trpc } from "@/trpc/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface PlaylistHeaderSectionProps {
    playlistId: string
}

export const PlaylistHeaderSection = ({
    playlistId
}: PlaylistHeaderSectionProps) => {
    return (
        <Suspense fallback={<PlaylistHeaderSectionSkeleton />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <PlaylistHeaderSectionSuspense playlistId={playlistId} />
            </ErrorBoundary>
        </Suspense>
    )
}

export const PlaylistHeaderSectionSkeleton = () => {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
        </div>
    )
}

const PlaylistHeaderSectionSuspense = ({
    playlistId
}: PlaylistHeaderSectionProps) => {
    const router = useRouter()
    const util = trpc.useUtils()

    const [playlist] = trpc.playlists.getOne.useSuspenseQuery({ id: playlistId })

    const remove = trpc.playlists.remove.useMutation({
        onSuccess: () => {
            util.playlists.getMany.invalidate()
            toast.success("Playlist removed")
            router.push("/playlists")
        },
        onError: () => {
            toast.error("Something went wrong")
        }
    })

    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">{playlist.name}</h1>
                <p className="text-xs text-muted-foreground">{playlist.description}</p>
            </div>
            <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => remove.mutate({ id: playlistId })}
                disabled={remove.isPending}
            >
                <Trash2Icon />
            </Button>
        </div>
    )
}
