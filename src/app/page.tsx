import { redirect } from "next/navigation";

export default function Home() {
  // Since this is an internal tool, the root page should just redirect to the dashboard.
  // The middleware will automatically catch unauthenticated users and send them to /login.
  redirect("/dashboard/admin");
}
