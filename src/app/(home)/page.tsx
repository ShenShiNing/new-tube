import { trpc } from "@/trpc/server"

export default async function Home() {
  const data = await trpc.hello({ text: 'ShenShining' })
  
  return (
    <div>
      Client components says: { data.greeting }
    </div>
  )
}