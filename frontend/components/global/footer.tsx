import { cn } from "@/lib/utils"
import Link from 'next/link'
import { FooterConfig } from "@/lib/config/footer"

interface FooterProps {
    className?: string;
    config: FooterConfig;
}

const Footer = ({ className, config }: FooterProps) => {
    return (
        <footer className={cn("w-full border-t border-border", className)}>
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid gap-8 lg:grid-cols-6">
                    {/* Brand section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold">{config.brand.title}</span>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            {config.brand.description}
                        </p>
                    </div>

                    {/* Links sections */}
                    <div className="col-span-4 grid grid-cols-2 gap-8 sm:grid-cols-4">
                        {config.sections.map((section) => (
                            <div key={section.title}>
                                <h3 className="text-sm font-semibold">{section.title}</h3>
                                <ul className="mt-4 space-y-3 text-sm">
                                    {section.links.map((link) => (
                                        <li key={`${section.title}-${link.label}`}>
                                            <Link 
                                                href={link.href} 
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 border-t border-border/40 pt-8">
                    <p className="text-sm text-muted-foreground">
                        {config.copyright}
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
