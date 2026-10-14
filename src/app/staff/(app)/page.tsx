import { requireStaff } from "@/lib/auth/server";
import { StaffHome } from "@/features/staff/home";

export default async function StaffHomePage() {
  await requireStaff();
  return <StaffHome />;
}
