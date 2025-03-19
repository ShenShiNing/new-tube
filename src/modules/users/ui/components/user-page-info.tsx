import Link from "next/link"
import { cn } from "@/lib/utils"
import { useClerk, useAuth } from "@clerk/nextjs"
import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { UserGetOneOutput } from "@/modules/users/types"
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button"
import { Skeleton } from "@/components/ui/skeleton"

interface UserPageInfoProps {
    user: UserGetOneOutput
}

export const UserPageInfoSkeleton = () => {
    return (
        <div className="py-6">
            {/* Mobile layout */}
            <div className="flex flex-col md:hidden">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-[60px] h-[60px] rounded-full" />
                    <div className="flex-1 min-w-0">
                        <Skeleton className="w-32 h-6" />
                        <Skeleton className="w-48 h-4 mt-1" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full mt-3 rounded-full" />
            </div>
            {/* Desktop layout */}
            <div className="hidden md:flex items-start gap-4">
                <Skeleton className="w-[160px] h-[160px] rounded-full" />
                <div className="flex-1 min-w-0">
                    <Skeleton className="w-64 h-8" />
                    <Skeleton className="w-48 h-5 mt-4" />
                    <Skeleton className="w-32 h-10 mt-3 rounded-full" />  
                </div>
            </div>
        </div>
    )
}

export const UserPageInfo = ({ user }: UserPageInfoProps) => {
    const clerk = useClerk()
    const { userId, isLoaded } = useAuth()

    const { isPending, onClick } = useSubscription({
        userId: user.id,
        isSubscribed: user.viewerSubscribed,
    })

    return (
        <div className="py-6">
            {/* Mobile layout */}
            <div className="flex flex-col md:hidden">
                <div className="flex items-center gap-3">
                    <UserAvatar
                        imageUrl={user.imageUrl}
                        name={user.name}
                        size="lg"
                        className="h-[60px] w-[60px]"
                        onClick={() => {
                            if (user.clerId === userId) {
                                clerk.openUserProfile()
                            }
                        }}
                    />
                    <div className="flex-1 min-w-8">
                        <h1 className="text-xl font-bold">{user.name}</h1>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <span>{user.subscriberCount} Subscribers</span>
                            <span>•</span>
                            <span>{user.videoCount} Videos</span>
                        </div>
                    </div>
                </div>
                {userId === user.clerId ? (
                    <Button
                        asChild
                        variant="secondary"
                        className="w-full mt-3 rounded-full"
                    >
                        <Link href="/studio">Go to studio</Link>
                    </Button>
                ) : (
                    <SubscriptionButton
                        onClick={onClick}
                        isSubscribed={user.viewerSubscribed}
                        disabled={isPending || !isLoaded}
                        className="w-full mt-3"
                    />
                )}
            </div>
            {/* Desktop layout */}
            <div className="hidden md:flex items-start gap-4">
                <UserAvatar
                    size="xl"
                    imageUrl={user.imageUrl}
                    name={user.name}
                    className={cn(
                        userId === user.clerId
                        && "cursor-pointer hover:opacity-80 transition-opacity duration-300"
                    )}
                    onClick={() => {
                        if (user.clerId === userId) {
                            clerk.openUserProfile()
                        }
                    }}
                />
                <div className="flex-1 min-w-0">
                    <h1 className="text-4xl font-bold">{user.name}</h1>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
                        <span>{user.subscriberCount} Subscribers</span>
                        <span>•</span>
                        <span>{user.videoCount} Videos</span>
                    </div>
                    {userId === user.clerId ? (
                        <Button
                            asChild
                            variant="secondary"
                            className="mt-3 rounded-full"
                        >
                            <Link href="/studio">Go to studio</Link>
                        </Button>
                    ) : (
                        <SubscriptionButton
                            onClick={onClick}
                            isSubscribed={user.viewerSubscribed}
                            disabled={isPending || !isLoaded}
                            className="mt-3"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
