import { LikedVideoSection } from "@/modules/playlists/ui/sections/liked-video-section"

export const LikedView = () => {
    return (
        <div className="max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            <div>
                <h1 className="text-2xl font-bold">Liked</h1>
                <p className="text-sm text-muted-foreground">
                    Videos you have liked
                </p>
            </div>
            <LikedVideoSection />
        </div>
    )
}