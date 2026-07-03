import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "ADMIN") redirect("/admin");
  if (role === "FAE") redirect("/fae/orders");
  if (role === "SALES") redirect("/sales/orders");
  if (role === "RD") redirect("/rd/orders");

  redirect("/login");
}
