import { SUPPORTED_LANGUAGES } from "@/lib/constants";

interface SearchFiltersProps {
    onSearch?: (query: string) => void;
    onLanguageChange?: (language: string) => void;
    onGenreChange?: (genre: string) => void;
}

export default function SearchFilters({
    onSearch,
    onLanguageChange,
    onGenreChange,
}: SearchFiltersProps) {
    return (
        <div className="bg-white border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl text-text-main-light">
                            Browse By
                        </h3>
                        <div className="h-px w-12 bg-primary" />
                    </div>

                    <form className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-grow">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-gray-400">search</span>
                            </span>
                            <input
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-background-light text-text-main-light placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                placeholder="Search by title, author, or ISBN..."
                                type="text"
                                onChange={(e) => onSearch?.(e.target.value)}
                            />
                        </div>

                        {/* Language Dropdown */}
                        <div className="relative w-full md:w-48">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-gray-400">translate</span>
                            </span>
                            <select
                                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg leading-5 bg-background-light text-text-main-light focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm appearance-none cursor-pointer"
                                onChange={(e) => onLanguageChange?.(e.target.value)}
                            >
                                <option value="">All Languages</option>
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-gray-400">expand_more</span>
                            </span>
                        </div>

                        {/* Genre Dropdown */}
                        <div className="relative w-full md:w-48">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-gray-400">category</span>
                            </span>
                            <select
                                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg leading-5 bg-background-light text-text-main-light focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm appearance-none cursor-pointer"
                                onChange={(e) => onGenreChange?.(e.target.value)}
                            >
                                <option value="">All Genres</option>
                                <option value="fiction">Fiction</option>
                                <option value="comics">Comics</option>
                                <option value="scifi">Sci-Fi</option>
                                <option value="fantasy">Fantasy</option>
                                <option value="romance">Romance</option>
                                <option value="thriller">Thriller</option>
                            </select>
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-gray-400">expand_more</span>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
