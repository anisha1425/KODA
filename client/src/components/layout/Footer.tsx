import { Link, useLocation } from "react-router-dom";
import { BookOpen, Github } from "lucide-react";

export default function Footer() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <footer className="border-t border-border bg-secondary/50 py-12">
            <div className="container mx-auto px-4">
                {isHomePage && (
                    <div className="grid gap-8 md:grid-cols-4">
                        {/* Brand */}
                        <div className="md:col-span-1">
                            <Link to="/" className="flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary" />
                                <span className="font-heading text-lg font-bold text-foreground">KODA</span>
                            </Link>
                            <p className="mt-3 text-sm text-muted-foreground">
                                A free, multilingual platform for reading and publishing stories.
                                Join our community of readers and writers.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground transition-colors hover:text-primary hover:border-primary/30"
                                >
                                    <Github className="h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        {/* Explore */}
                        <div>
                            <h4 className="font-heading text-sm font-semibold text-foreground">Explore</h4>
                            <ul className="mt-3 space-y-2">
                                {[
                                    { label: "Browse Stories", href: "/search" },
                                    { label: "New Releases", href: "/search?sort=newest" },
                                    { label: "Trending", href: "/search?sort=trending" },
                                    { label: "Genres", href: "/search" },
                                    { label: "Authors", href: "/search" }
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link to={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* For Writers */}
                        <div>
                            <h4 className="font-heading text-sm font-semibold text-foreground">For Writers</h4>
                            <ul className="mt-3 space-y-2">
                                {[
                                    { label: "Start Writing", href: "/author" },
                                    { label: "Author Dashboard", href: "/author" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link to={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="font-heading text-sm font-semibold text-foreground">Support</h4>
                            <ul className="mt-3 space-y-2">
                                {[
                                    { label: "Contact Us", href: "/support/contact" },
                                    { label: "Privacy Policy", href: "/support/privacy" },
                                    { label: "Terms of Service", href: "/support/terms" }
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link to={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="mt-10 border-t border-border pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        © 2026 KODA. All rights reserved. Made with ❤️ for readers and writers.
                    </p>
                </div>
            </div>
        </footer>
    );
}
