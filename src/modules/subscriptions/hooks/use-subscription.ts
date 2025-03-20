import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";

interface UseSubscriptionProps {
    userId: string,
    isSubscribed: boolean,
    formVideoId?: string
}

export const useSubscription = ({
    userId,
    isSubscribed,
    formVideoId
}: UseSubscriptionProps) => {
    const clerk = useClerk()
    const utils = trpc.useUtils()

    const subscribe = trpc.subscriptions.create.useMutation({
        onSuccess: () => {
            toast.success("Subscribed")
            utils.subscriptions.getMany.invalidate()
            utils.videos.getManySubscribed.invalidate()
            utils.users.getOne.invalidate({ id: userId })

            if (formVideoId) {
                utils.videos.getOne.invalidate({ id: formVideoId })
            }
        },
        onError: (error) => {
            if (error.data?.code === "UNAUTHORIZED") {
                toast.error("Please login to subscribe")
                clerk.openSignIn()
            } else {
                toast.error("Something went wrong")
            }
            
        }
    })
    const unSubscribe = trpc.subscriptions.remove.useMutation({
        onSuccess: () => {
            toast.success("Unsubscribed")
            utils.subscriptions.getMany.invalidate()
            utils.videos.getManySubscribed.invalidate()
            utils.users.getOne.invalidate({ id: userId })

            if (formVideoId) {
                utils.videos.getOne.invalidate({ id: formVideoId })
            }
        },
        onError: (error) => {
            if (error.data?.code === "UNAUTHORIZED") {
                toast.error("Please login to unsubscribe")
                clerk.openSignIn()
            } else {
                toast.error("Something went wrong")
            }
        }
    })

    const isPending = subscribe.isPending || unSubscribe.isPending

    const onClick = () => {
        if (isSubscribed) {
            unSubscribe.mutate({ userId })
        } else {
            subscribe.mutate({ userId })
        }
    }

    return {
        isPending,
        onClick
    }
}
