const features = [
    {
        icon: 'library_books',
        title: 'Vast Library',
        description: 'Over 50k titles available',
    },
    {
        icon: 'public',
        title: 'Global Access',
        description: 'Read in 30+ languages',
    },
    {
        icon: 'phone_iphone',
        title: 'Read Anywhere',
        description: 'Seamless sync across devices',
    },
    {
        icon: 'edit_note',
        title: 'Self Publish',
        description: 'Share your story with the world',
    },
];

export default function FeatureCards() {
    return (
        <section className="py-16 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group p-4 hover:bg-white rounded-xl transition-colors duration-300 cursor-pointer"
                        >
                            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-icons-outlined">{feature.icon}</span>
                            </div>
                            <h4 className="font-display font-semibold text-lg mb-1">{feature.title}</h4>
                            <p className="text-xs text-text-muted-light">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
