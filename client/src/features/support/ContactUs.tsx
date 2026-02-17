import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactUs() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="font-heading text-4xl font-bold mb-8 text-center text-foreground">Contact Us</h1>

            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-semibold mb-6 text-foreground">Get in Touch</h2>
                    <p className="text-muted-foreground mb-8">
                        Have questions about KODA? We're here to help. Send us a message and we'll respond as soon as possible.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Email</h3>
                                <p className="text-muted-foreground">support@koda.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                                <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Office</h3>
                                <p className="text-muted-foreground">42, Bandra West<br />Mumbai, Maharashtra 400050</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                                <Phone className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Phone</h3>
                                <p className="text-muted-foreground">+91 98765 43210</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Message</label>
                            <textarea
                                rows={4}
                                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                placeholder="How can we help?"
                            />
                        </div>

                        <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
