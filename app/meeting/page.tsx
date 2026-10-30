import { redirect } from "next/navigation"

export default function MeetingPageRedirect({ searchParams }: { searchParams: { id?: string } }) {
  if (searchParams.id) {
    redirect(`/edit?id=${searchParams.id}`)
  }
  redirect("/create")
}
