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
import { usePlanoUnificado } from "@/hooks/usePlanoUnificado";
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
  { title: "Dashboard",   url: "/dashboard",   icon: LayoutDashboard, completoOnly: false, tour: "dashboard"   },
  { title: "Agenda",      url: "/agenda",       icon: CalendarDays,    completoOnly: false, tour: "agenda"      },
  { title: "Pacientes",   url: "/pacientes",    icon: Users,           completoOnly: false, tour: "pacientes"   },
  { title: "Receitas",    url: "/receitas",     icon: TrendingUp,      completoOnly: true,  tour: "receitas"    },
  { title: "Despesas",    url: "/despesas",     icon: TrendingDown,    completoOnly: true,  tour: "despesas"    },
  { title: "Estoque",     url: "/estoque",      icon: Package,         completoOnly: true,  tour: "estoque"     },
  { title: "Planejamento",url: "/planejamento", icon: Target,          completoOnly: true,  tour: "planejamento"},
  { title: "Relatórios",  url: "/relatorios",   icon: FileText,        completoOnly: true,  tour: "relatorios"  },
  { title: "Perfil",      url: "/perfil",       icon: User,            completoOnly: false, tour: "perfil"      },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isCompleto } = usePlanoUnificado();

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
            ? <GestCliniLogo size="sm" variant="dark" className="justify-center" />
            : <GestCliniLogo size="md" variant="dark" />
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
                    <SidebarMenuItem key={item.title} data-tour={item.tour}>
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
                  <SidebarMenuItem key={item.title} data-tour={item.tour}>
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
