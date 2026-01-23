
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
        <div className={`sticky ${isAdminPreview ? 'top-[44px]' : 'top-0'} bg-white border-t border-gray-100 overflow-x-auto no-scrollbar py-2 px-4 flex gap-2 z-40 shadow-sm transition-all`}>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onCategoryClick(cat)}
                    className={`
                whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all
                ${activeCategory === cat
                            ? 'bg-brand-900 text-white shadow-md transform scale-105'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
            `}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};
