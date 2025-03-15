'use client'

import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { trpc } from "@/trpc/client"

import { Loader2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResponsiveModal } from "@/components/responsive-modal"
import { StudioUploader } from "./studio.uploader"

export const StudioUploadModal = () => {
    const router = useRouter()
    const utils = trpc.useUtils()
    const create = trpc.videos.create.useMutation({
        onSuccess: () => {
            toast.success('Video created')
            utils.studio.getMany.invalidate()
        },
        onError: (error) => {
            console.log(error);
            
            toast.error('Something went wrong')
        }
    })

    const onSuccess = () => {
        if (!create.data?.video.id) return

        create.reset()
        router.push(`/studio/videos/${create.data.video.id}`)
    }
    return (
        <>
            <ResponsiveModal 
                title="Upload a video"
                open={!!create.data?.url}
                onOpenChange={() => create.reset()}
            >
                {create.data?.url 
                    ? <StudioUploader endpoint={create.data.url} onSuccess={onSuccess} />
                    : <Loader2Icon />
                }
            </ResponsiveModal>
            <Button variant="secondary" onClick={() => create.mutate()}>
                {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
                Create
            </Button>
        </>
    )
}