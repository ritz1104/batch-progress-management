import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, FileText, ArrowRight, X } from 'lucide-react';
import { reportApi } from '../api/client';

export default function MonthEndBanner({ onOpenReportModal, currentMonth }) {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await reportApi.getMonthEndStatus();
        setStatus(res);
      } catch (err) {
        console.warn('Failed to check month end status:', err);
      }
    }
    checkStatus();
  }, []);

  if (dismissed) return null;

  // Show banner if isMonthEnd or if user wants to generate for the month
  const isTargetMonth = status && status.currentMonth === currentMonth;

  return (
    <div className="bg-[#FAF4EB] border-b border-[#F0E6D2] px-6 py-2.5 text-xs text-[#5D4219] flex items-center justify-between transition-all">
      <div className="flex items-center gap-2.5 flex-1 pr-4">
        <div className="w-5 h-5 rounded-full bg-[#E8D9BD] flex items-center justify-center flex-shrink-0">
          <Calendar className="w-3 h-3 text-[#7A5822]" />
        </div>
        <div>
          <span className="font-semibold text-[#483313]">
            {status?.isMonthEnd ? '⚡ Month-End Report Cycle Active:' : '📅 Monthly Batch Report Station:'}
          </span>{' '}
          <span className="text-[#6D532B]">
            Batch curriculum logs, student attendance matrices, and hackathon results for {status?.monthName || 'this month'} are compiled and ready for PDF generation.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#7A5822] text-white hover:bg-[#634618] text-xs font-medium transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Generate Official PDF</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-[#E8D9BD] rounded text-[#8F7449] transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
