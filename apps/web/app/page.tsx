import { redirect } from "next/navigation";

// The request proxy sends signed-out visitors to /login; signed-in ones land on the dashboard.
export default function Home() {
  redirect("/dashboard");
}
