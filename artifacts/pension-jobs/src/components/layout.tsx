import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, Briefcase, Bell, User as UserIcon, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

function PensionPendingLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PensionPending logo"
    >
      <rect width="36" height="36" rx="6" fill="hsl(24 95% 50%)" />
      <path
        d="M18 5 L31 29 H5 Z"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line x1="18" y1="14" x2="18" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="25.5" r="1.5" fill="white" />
    </svg>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Job Board", icon: Briefcase },
    { href: "/subscriptions", label: "Alerts", icon: Bell },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <PensionPendingLogo className="w-9 h-9 transition-transform group-hover:scale-105" />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-bold text-lg tracking-tight text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  PensionPending
                </span>
                <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium">.com</span>
              </div>
            </Link>

            <Show when="signed-in">
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href || location.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </Show>
          </div>

          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <Link href="/sign-in" className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground hidden sm:block">
                Sign In
              </Link>
              <Button asChild className="font-semibold">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </Show>

            <Show when="signed-in">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                      <AvatarFallback>{user?.firstName?.charAt(0) || <UserIcon className="w-4 h-4" />}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.fullName && <p className="font-medium">{user?.fullName}</p>}
                      {user?.primaryEmailAddress && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.primaryEmailAddress.emailAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full flex items-center cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                    <div className="flex flex-col gap-4 mt-6">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href || location.startsWith(`${item.href}/`);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </Show>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>
      
      <footer className="border-t py-8 bg-[hsl(222,47%,14%)] text-white/70">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <PensionPendingLogo className="w-6 h-6 opacity-80" />
            <span className="font-medium text-white/90" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              PensionPending.com
            </span>
            <span className="text-white/40">·</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
