import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Militares", path: "/militares", icon: Users },
  { label: "Averbações", path: "/averbacoes", icon: FileText },
  { label: "Afastamentos", path: "/afastamentos", icon: Clock },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border shrink-0">
          <img
            src="https://media.base44.com/images/public/69fc841eb1f6cbfcf79a9bcb/92168c1fe_DGPb.png"
            alt="DGP"
            className="w-9 h-9 object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">DGP</p>
            <p className="text-[11px] text-muted-foreground">Reserva Remunerada</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Diretoria de Gestão de Pessoal
          </p>
        </div>
      </aside>
    </>
  );
}