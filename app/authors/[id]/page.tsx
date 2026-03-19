import { AuthorBooks } from "@/components/author-books"

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = (await params)


    return (
        <div className="container mx-auto px-4 py-8">
            <AuthorBooks authorId={id} />
        </div>
    )
}
