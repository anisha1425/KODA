import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ReaderHeaderProps {
    bookTitle: string;
    availableLanguages?: { code: string; bookId: string }[];
    currentLanguage?: string;
    onLanguageChange?: (bookId: string) => void;
    onBookmark?: () => void;
}

export default function ReaderHeader({
    bookTitle,
    availableLanguages = [],
    currentLanguage = 'en',
    onLanguageChange,
    onBookmark,
}: ReaderHeaderProps) {
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);

    return (
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100/50 transition-colors duration-300 flex-none z-50">
            <div className="container mx-auto px-6 h-14 flex items-center justify-between">
                {/* Left: Back / Title */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-gray-400 hover:text-primary transition-colors">
                        <span className="material-icons-outlined text-xl">arrow_back</span>
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold truncate max-w-[200px] md:max-w-md text-gray-800">{bookTitle}</span>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2">
                    {/* Bookmark Button */}
                    <button
                        onClick={onBookmark}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-primary"
                        title="Bookmark location"
                    >
                        <span className="material-icons-outlined text-xl">bookmark_border</span>
                    </button>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    {/* Language Dropdown */}
                    {(availableLanguages.length > 0) && (
                        <div className="relative">
                            <button
                                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
                                title="Language"
                            >
                                <span className="material-icons-outlined text-xl">language</span>
                            </button>
                            {isLanguageOpen && (
                                <div className="absolute right-0 mt-3 w-40 bg-white border border-gray-200 shadow-lg rounded-xl z-50 overflow-hidden py-1">
                                    {availableLanguages.map((lang) => (
                                        <button
                                            key={lang.bookId}
                                            onClick={() => {
                                                if (onLanguageChange) onLanguageChange(lang.bookId);
                                                setIsLanguageOpen(false);
                                            }}
                                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${currentLanguage === lang.code ? 'text-primary font-bold' : 'text-gray-700'}`}
                                        >
                                            {new Intl.DisplayNames(['en'], { type: 'language' }).of(lang.code) || lang.code.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
