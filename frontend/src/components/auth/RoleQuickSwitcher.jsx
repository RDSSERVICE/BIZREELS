import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiShoppingCart, FiVideo } from 'react-icons/fi';

/**
 * RoleQuickSwitcher Component
 * Renders the 3 portal quick access pill tabs (Customer, Vendor, Creator)
 * matching the Warm Editorial Bento-Brutalism system used on Register.
 */
export default function RoleQuickSwitcher({ label = 'Log In As' }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const roles = [
    {
      key: 'customer',
      label: 'Customer',
      path: '/auth/customer-login',
      icon: FiShoppingBag,
    },
    {
      key: 'vendor',
      label: 'Vendor',
      path: '/auth/vendor-login',
      icon: FiShoppingCart,
    },
    {
      key: 'creator',
      label: 'Creator',
      path: '/auth/creator-login',
      icon: FiVideo,
    },
  ];

  return (
    <div className="flex flex-col gap-1.5 w-full font-sans text-left">
      {label && (
        <label className="text-[11px] font-extrabold tracking-wider text-slate-700 uppercase">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f5efe4] rounded-xl border border-[#e3dccb]">
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive =
            currentPath === role.path ||
            (currentPath === '/auth/login' && role.key === 'customer');

          return (
            <Link
              key={role.key}
              to={role.path}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all no-underline border ${
                isActive
                  ? 'bg-[#1c1a17] text-[#d99a3d] border-[#1c1a17] shadow-2xs'
                  : 'bg-transparent text-slate-700 border-transparent hover:bg-white/60'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isActive ? 'text-[#d99a3d]' : 'text-slate-600'
                }`}
              />
              <span className="truncate">{role.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


