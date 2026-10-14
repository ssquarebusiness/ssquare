import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale-aware Link / router for the public website. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
