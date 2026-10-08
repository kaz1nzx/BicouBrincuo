import { Login } from "@/components/login";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  const q = await searchParams;
  return <Login reset={q.reset === "1"} error={q.error} />;
}
