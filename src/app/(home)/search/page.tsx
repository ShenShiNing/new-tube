import { DEFAULT_LIMIT } from "@/constants"
import { trpc, HydrateClient } from "@/trpc/server"
import { SearchView } from "@/modules/search/ui/views/search-view"

export const dynamic = "force-dynamic"

interface SearchPageProps {
    searchParams: Promise<{
        query: string | undefined
        categoryId: string | undefined
    }>
}

const SearchPage = async({
    searchParams
}: SearchPageProps) => {
    const { query, categoryId } = await searchParams

    void trpc.categories.getMany.prefetch()
    void trpc.search.getMany.prefetchInfinite({
        query,
        categoryId,
        limit: DEFAULT_LIMIT
    })

    return (
        <HydrateClient>
           <SearchView query={query} categoryId={categoryId}/>
        </HydrateClient>
    )
}

export default SearchPage
