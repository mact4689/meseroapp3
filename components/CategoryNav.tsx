
import React from 'react';

interface CategoryNavProps {
    categories: string[];
    activeCategory: string;
    onCategoryClick: (category: string) => void;
    isAdminPreview: boolean;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
    categories,
    activeCategory,
    onCategoryClick,
    isAdminPreview
}) => {
    return (
        <div className={`sticky ${isAdminPreview ? 'top-[44px]' : 'top-0'} bg-white/80 backdrop-blur-md border-b border-gray-100 overflow-x-auto no-scrollbar py-3 px-4 flex gap-3 z-40 transition-all`}>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onCategoryClick(cat)}
                    className={`
                whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out
                ${activeCategory === cat
                            ? 'bg-brand-900 text-white shadow-lg shadow-brand-900/20 transform scale-105'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}
            `}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};
