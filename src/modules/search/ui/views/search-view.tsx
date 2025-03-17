'use client'

import { CategoriesSection } from "@/modules/search/ui/sections/categories-section"
import { ResultsSection } from "@/modules/search/ui/sections/results.section"

interface SearchPageProps {
    query: string | undefined
    categoryId: string | undefined
}

export const SearchView = ({
    query,
    categoryId
}: SearchPageProps) => {
    return (
        <div className="max-w-[1300px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-2.5">
            <CategoriesSection categoryId={categoryId} />
            <ResultsSection query={query} categoryId={categoryId} />
        </div>
    )
}
