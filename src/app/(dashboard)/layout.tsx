import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { headers } from "next/headers";

// Map pathnames to page titles
function getTitleFromPath(pathname: string): string {
  if (pathname.includes("/dashboard")) return "Dashboard";
  if (pathname.includes("/rooms")) return "Rooms";
  if (pathname.includes("/calendar")) return "Availability Calendar";
  if (pathname.includes("/bookings")) return "Bookings";
  if (pathname.includes("/channels")) return "Channel Manager";
  if (pathname.includes("/rates")) return "Rate Plans";
  if (pathname.includes("/analytics")) return "Analytics";
  if (pathname.includes("/properties")) return "Properties";
  if (pathname.includes("/settings")) return "Settings";
  return "HotelSync";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/dashboard";
  const title = getTitleFromPath(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title={title}
          userName={session.user?.name ?? "User"}
          userEmail={session.user?.email ?? ""}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
