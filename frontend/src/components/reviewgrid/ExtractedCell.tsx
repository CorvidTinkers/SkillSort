import React from 'react';
import { ExtractedField } from '../../types';

interface ExtractedCellProps {
  field: ExtractedField;
}

export const ExtractedCell: React.FC<ExtractedCellProps> = ({ field }) => {
  const confidence = field.confidence;
  let textColor = 'text-slate-800';
  let dotColor = '';

  if (confidence === 'high') {
    textColor = 'text-emerald-700 font-semibold';
    dotColor = 'bg-emerald-500';
  } else if (confidence === 'medium') {
    textColor = 'text-amber-700 font-semibold';
    dotColor = 'bg-amber-500';
  } else if (confidence === 'low') {
    textColor = 'text-rose-700 font-semibold';
    dotColor = 'bg-rose-500';
  }

  return (
    <div className="flex items-center gap-2 h-full py-0.5 select-none">
      {dotColor && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span 
        className={`${textColor} truncate block text-[13px] tracking-tight max-w-[220px]`} 
        title={String(field.value)}
      >
        {field.value}
      </span>
    </div>
  );
};
