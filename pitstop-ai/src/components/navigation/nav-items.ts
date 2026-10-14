import { Calculator, Compass, Factory, Scales, SquaresFour } from "@phosphor-icons/react";

export const NAV_ITEMS = [
  { href: "/cars", label: "Explore", short: "Explore", icon: SquaresFour },
  { href: "/brands", label: "Brands", short: "Brands", icon: Factory },
  { href: "/discover", label: "Find My Car", short: "Find", icon: Compass },
  { href: "/compare", label: "Compare", short: "Compare", icon: Scales },
  { href: "/ownership", label: "Cost Lab", short: "Costs", icon: Calculator },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
