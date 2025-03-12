interface PageProps {
    params: Promise<{ videoId: string }>
}

export default async function Page({ params }: PageProps) {
    const { videoId } = await params
    return (
        <div>
            Video Id: {videoId}
        </div>
    )
}