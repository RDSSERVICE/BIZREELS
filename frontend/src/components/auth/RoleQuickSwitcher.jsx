import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiShoppingCart, FiVideo } from 'react-icons/fi';

/**
 * RoleQuickSwitcher Component
 * Renders the 3 portal quick access buttons (CUSTOMER, VENDOR, CREATOR)
 * styled according to Warm Editorial Bento-Brutalism system.
 */
export default function RoleQuickSwitcher() {
  const location = useLocation();
  const currentPath = location.pathname;

  const roles = [
    {
      key: 'customer',
      label: 'CUSTOMER',
      path: '/auth/customer-login',
      icon: FiShoppingBag,
    },
    {
      key: 'vendor',
      label: 'VENDOR',
      path: '/auth/vendor-login',
      icon: FiShoppingCart,
    },
    {
      key: 'creator',
      label: 'CREATOR',
      path: '/auth/creator-login',
      icon: FiVideo,
    },
  ];

  return (
    <div className="flex flex-col gap-1.5 pt-1 w-full font-sans">
      <div className="relative flex items-center justify-center my-0.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e3dccb]" />
        </div>
        <span className="relative bg-white px-2.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
          OR PORTAL ACCESS:
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive = currentPath === role.path;

          return (
            <Link
              key={role.key}
              to={role.path}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-center transition-all no-underline ${
                isActive
                  ? 'bg-[#1c1a17] text-[#d99a3d] border-[#1c1a17] shadow-2xs'
                  : 'bg-[#f8f4ec] hover:bg-[#eae3d2] text-slate-700 border-[#e3dccb]'
              }`}
            >
              <Icon size={12} className={isActive ? 'text-[#d99a3d]' : 'text-slate-600'} />
              <span className="text-[9px] font-black uppercase tracking-wider">
                {role.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

