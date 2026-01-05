import Link from "next/link"
import { PanelLeft } from "lucide-react"


import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { signOut } from "@/lib/auth"
import Logo from "./components/logo"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
    email: string;
    appName: string;
    navigationItems: {
        href: string;
        icon: React.ComponentType<{ className?: string }>;
        label: string;
    }[];
}

export default function MobileHeader({ email, navigationItems, appName }: MobileHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:static lg:h-auto lg:border-0 lg:bg-transparent lg:px-6">
            <Sheet>
                <VisuallyHidden>
                    <SheetHeader>
                        <SheetTitle>Sidebar</SheetTitle>
                        <SheetDescription>Sidebar</SheetDescription>
                    </SheetHeader>
                </VisuallyHidden>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="lg:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="md:max-w-xs">
                    <nav className="grid gap-6 font-medium">
                        <SheetTrigger asChild>
                            <Link
                                href="/"
                                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                            >
                                <Logo />
                                <span className="sr-only">{appName}</span>
                            </Link>
                        </SheetTrigger>
                        <hr />

                        {navigationItems.map((item) => (
                            <SheetTrigger key={item.href} asChild>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            </SheetTrigger>
                        ))}

                        <div className="fixed bottom-2">
                            <div className="ml-3 mb-2">
                                <span className="text-md font-bold">
                                    {email}
                                </span>
                            </div>

                            <form
                                action={async () => {
                                    "use server"
                                    await signOut({ redirectTo: "/" })
                                }}
                            >
                                <button type="submit">
                                    <div className='flex items-center gap-3 rounded-lg  px-3 py-2 text-gray-900  transition-all hover:text-gray-900  dark:text-gray-300 dark:hover:text-gray-50'>
                                        Logout
                                    </div>
                                </button>
                            </form>
                        </div>

                    </nav>
                </SheetContent>
            </Sheet>
        </header >
    )
}
