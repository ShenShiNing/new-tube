import { toast } from "sonner"
import { ListPlusIcon, MoreVerticalIcon, ShareIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface VideoMenuProps {
    videoId: string
    variant: "ghost" | "secondary",
    onRemove?: () => void
}

// TODO: properly implement menu
export const VideoMenu = ({
    videoId,
    variant = "ghost",
    onRemove
}: VideoMenuProps) => {
    const onShare = () => {
        // TODO: Change if deploying outside of Vercel
        const fullUrl = `${process.env.VERCEL_URL || "https://localhost:3000"}/videos/${videoId}`
        navigator.clipboard.writeText(fullUrl)
        toast.success("Link copied to clipboard")
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size="icon" className="rounded-full">
                    <MoreVerticalIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onShare}>
                    <ShareIcon className="mr-2 size-4" />
                    Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { }}>
                    <ListPlusIcon className="mr-2 size-4" />
                    Add to playlist
                </DropdownMenuItem>
                {onRemove && (
                    <DropdownMenuItem onClick={() => { }}>
                        <Trash2Icon className="mr-2 size-4" />
                        Remove
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
