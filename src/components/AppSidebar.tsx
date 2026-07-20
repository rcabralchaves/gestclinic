import {
  LayoutDashboard,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Target,
  FileText,
  User,
  CalendarDays,
  LogOut,
  Lock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlano } from "@/hooks/usePlano";
import { GestCliniLogo } from "@/components/GestCliniLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, completoOnly: false },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, completoOnly: true },
  { title: "Pacientes", url: "/pacientes", icon: Users, completoOnly: true },
  { title: "Receitas", url: "/receitas", icon: TrendingUp, completoOnly: false },
  { title: "Despesas", url: "/despesas", icon: TrendingDown, completoOnly: false },
  { title: "Estoque", url: "/estoque", icon: Package, completoOnly: true },
  { title: "Planejamento", url: "/planejamento", icon: Target, completoOnly: true },
  { title: "Relatórios", url: "/relatorios", icon: FileText, completoOnly: false },
  { title: "Perfil", url: "/perfil", icon: User, completoOnly: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isCompleto } = usePlano();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="gradient-sidebar border-r-0">
      <SidebarContent className="pt-6">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 pb-8">
          {collapsed
            ? <GestCliniLogo size="sm" variant="light" className="justify-center" />
            : <GestCliniLogo size="md" variant="light" />
          }
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                const locked = item.completoOnly && !isCompleto;

                if (locked) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            className="text-sidebar-foreground/40 cursor-not-allowed"
                          >
                            <item.icon className="mr-3 h-5 w-5 shrink-0" />
                            {!collapsed && (
                              <span className="flex items-center gap-2">
                                {item.title}
                                <Lock className="h-3 w-3" />
                              </span>
                            )}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Disponível apenas no plano completo
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        activeClassName=""
                      >
                        <item.icon className="mr-3 h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Logout */}
        <div className="mt-auto px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
