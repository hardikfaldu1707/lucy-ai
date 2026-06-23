import {
  BarChart3,
  Brain,
  Building2,
  Coins,
  Cpu,
  CreditCard,
  Flag,
  HardDrive,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Phone,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  MessageCircle,
  Phone,
  Brain,
  CreditCard,
  User,
  Settings,
  Sparkles,
  Flag,
  Wallet,
  Coins,
  Mail,
  BarChart3,
  TrendingUp,
  Building2,
  Cpu,
  HardDrive,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden="true" />;
}
