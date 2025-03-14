'use client'

import { trpc } from "@/trpc/client"
import { toast } from "sonner"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResponsiveModal } from "@/components/responsive-modal"
import { StudioUploader } from "./studio.uploader"

export const StudioUploadModal = () => {
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
    return (
        <>
            <ResponsiveModal 
                title="Upload a video"
                open={!!create.data?.url}
                onOpenChange={() => create.reset()}
            >
                {create.data?.url 
                    ? <StudioUploader endpoint={create.data.url} onSuccess={() => {}} />
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