import { redirect } from "next/navigation";

// Bare /guide has no content of its own — it only ever meant "the ordering
// guide", which now lives at /guide/customer alongside /guide/admin. Keeping
// this redirect means any link or bookmark to the old /guide path still works.
export default function GuideIndexPage() {
  redirect("/guide/customer");
}
