// src/components/layout/Sidebar.tsx
import { LayoutDashboard, Bell, Folder, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { WorkspaceNav } from './WorkspaceNav';

export const Sidebar = ({ mode: _mode }: { mode: string }) => {
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
    ];

    return (
        <aside className="w-64 bg-[#1a1a1a] text-gray-400 flex flex-col p-4 border-r border-gray-800 shrink-0 h-full">
            {/* Logo de Coda */}
            <div className="flex items-center gap-2 mb-8 ml-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#1a1a1a] font-black text-lg shadow-lg shadow-white/5">
                    C
                </div>
            </div>

            {/* Menú Principal */}
            <nav className="space-y-1 mb-10">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname === item.path
                                ? 'bg-gray-800 text-white shadow-inner'
                                : 'hover:bg-gray-800/50 hover:text-gray-200'
                            }`}
                    >
                        <item.icon size={18} />
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Selector de Workspace */}
            <div className="mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase px-3 mb-4 tracking-[0.2em]">ESPACIO DE TRABAJO</h2>
                <WorkspaceNav />
            </div>

            {/* Carpetas o Atajos */}
            <div className="space-y-1">
                <button className="flex items-center gap-3 px-3 py-2 w-full text-sm hover:bg-gray-800 rounded-xl transition-colors">
                    <Folder size={18} className="text-gray-600" />
                    <span>Proyectos</span>
                </button>
            </div>

            {/* Footer del Sidebar */}
            <div className="mt-auto pt-4 border-t border-gray-800/50">
                <button className="flex items-center gap-3 px-3 py-2 w-full text-sm hover:text-white transition-colors">
                    <Settings size={18} />
                    <span>Configuración</span>
                </button>
            </div>
        </aside>
    );
};