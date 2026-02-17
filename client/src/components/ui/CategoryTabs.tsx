import { useState } from 'react';

interface CategoryTabsProps {
    categories: string[];
    onSelect?: (category: string) => void;
}

export default function CategoryTabs({ categories, onSelect }: CategoryTabsProps) {
    const [activeCategory, setActiveCategory] = useState(categories[0]);

    const handleSelect = (category: string) => {
        setActiveCategory(category);
        onSelect?.(category);
    };

    return (
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => handleSelect(category)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${activeCategory === category
                        ? 'bg-text-main-light text-white'
                        : 'border border-gray-300 text-text-muted-light hover:border-primary hover:text-primary'
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}
