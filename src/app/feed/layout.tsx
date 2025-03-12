interface LayoutProps {
    children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div>
            <nav className="p-4 bg-rose-500 w-full">
                I am a navbar!
            </nav>
            {children}
        </div>
    )
}

export default Layout