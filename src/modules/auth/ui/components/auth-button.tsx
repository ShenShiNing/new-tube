'use client'

import { Button } from "@/components/ui/button"
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { ClapperboardIcon, UserCircleIcon } from "lucide-react"

export const AuthButton = () => {
    // TODO: Add different auth states

    return (
        <>
            <SignedIn>
                <UserButton>
                    <UserButton.MenuItems>
                        {/* TODO: Add user profile menu button */}
                        <UserButton.Link 
                            label="Studio"
                            href="/studio"
                            labelIcon={<ClapperboardIcon className="size-4" />}
                        />
                        <UserButton.Action label="manageAccount" />
                    </UserButton.MenuItems>
                </UserButton>
            </SignedIn>
            <SignedOut>
                <SignInButton mode="modal">
                    <Button
                        variant="outline"
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border-blue-500/2
                        rounded-full shadow-none"
                    >
                        <UserCircleIcon />
                        Sign in
                    </Button>
                </SignInButton>
            </SignedOut>
        </>
    )
}