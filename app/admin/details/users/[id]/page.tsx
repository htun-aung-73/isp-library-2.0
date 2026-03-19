import { UserBooks } from "@/components/user-books"

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    return (
        <div className="container mx-auto px-4 py-8">
            <UserBooks userId={id} />
        </div>
    )
}