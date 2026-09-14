import React from 'react';
import { FiArrowDownLeft, FiArrowUpRight } from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import AdminStatCard from '../../../../features/admin/components/AdminStatCard';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * WalletStatSummary
 * Renders the 3 top-level KPI stat cards for available credits, total deposited, and total spent.
 */
export default function WalletStatSummary({
  balance = 0,
  totalCredits = 0,
  totalDebits = 0,
}) {
  const { bi } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdminStatCard
        label={bi('Available Usage Credits', 'उपलब्ध उपयोग क्रेडिट्स')}
        value={`${Number(balance || 0).toLocaleString('en-IN')} Credits`}
        icon={TbCurrencyRupee}
        color="green"
      />
      <AdminStatCard
        label={bi('Total Credits Deposited', 'कुल जमा क्रेडिट')}
        value={`${Number(totalCredits || 0).toLocaleString('en-IN')} Credits`}
        icon={FiArrowDownLeft}
        color="blue"
      />
      <AdminStatCard
        label={bi('Total Credits Spent', 'कुल खर्च क्रेडिट')}
        value={`${Number(totalDebits || 0).toLocaleString('en-IN')} Credits`}
        icon={FiArrowUpRight}
        color="rose"
      />
    </div>
  );
}
