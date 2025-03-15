'use client'

import MuxPlayer from "@mux/mux-player-react"
import { THUMBNAIL_FALLBACK } from "../../constants"

interface VideoPlayerProps {
    playbackId?: string | null | undefined,
    thumbnailUrl?: string | null | undefined
    aoutPlay?: boolean
    onPlay?: () => void
}

export const VideoPlayer = ({
    playbackId,
    thumbnailUrl,
    aoutPlay,
    onPlay
}: VideoPlayerProps) => {
    // if (!playbackId) return
    return (
        <MuxPlayer 
            playbackId={playbackId || ""}
            poster={thumbnailUrl || THUMBNAIL_FALLBACK}
            playerInitTime={0}
            autoPlay={aoutPlay}
            thumbnailTime={0}
            className="w-full h-full object-contain"
            accentColor="#ff2056"
            onPlay={onPlay}
        />
    )
}