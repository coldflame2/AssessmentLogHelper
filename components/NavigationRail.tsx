import React, { useState } from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { CreditsIcon } from './icons/CreditsIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { ExportIcon } from './icons/ExportIcon';


interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isExpanded: boolean;
    isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isExpanded, isActive }) => {
    return (
        <li>
            <a 
                href="#" 
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 group ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'} ${!isExpanded ? 'justify-center' : ''}`}
                title={isExpanded ? undefined : label}
            >
                {icon}
                <span className={`ml-4 font-semibold text-sm transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0 max-w-0'}`}>
                    {label}
                </span>
            </a>
        </li>
    );
};

export const NavigationRail: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <aside className={`flex-shrink-0 border-r border-slate-200 transition-all duration-300 ease-in-out ${isExpanded ? 'w-56' : 'w-20'}`}>
            <nav className="flex flex-col h-full p-1">
                <div className="mb-4 border-b border-slate-200 pb-1">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex justify-center items-center p-1 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
                  >
                    <MenuIcon className="w-7 h-7 text-stone-700" />
                  </button>
                </div>

                
                <ul className="space-y-2">
                    <NavItem icon={<CreditsIcon className="w-6 h-6 flex-shrink-0" />} label="Credits" isExpanded={isExpanded} isActive={true} />
                    <NavItem icon={<ChartBarIcon className="w-6 h-6 flex-shrink-0" />} label="Analysis" isExpanded={isExpanded} />
                    <NavItem icon={<HistoryIcon className="w-6 h-6 flex-shrink-0" />} label="History" isExpanded={isExpanded} />
                    <NavItem icon={<ExportIcon className="w-6 h-6 flex-shrink-0" />} label="Export" isExpanded={isExpanded} />
                </ul>
            </nav>
        </aside>
    );
};
