'use client';

export default function ScoreBadge({ score, label, size = 'md' }) {
  if (!score) {
    return (
      <div className={`inline-flex items-center px-3 py-1.5 rounded-2xl bg-gray-100/80 backdrop-blur-sm text-gray-600 border border-gray-200/50 ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      }`}>
        {label}: N/A
      </div>
    );
  }

  const scoreUpper = score.toUpperCase();
  let bgColor, textColor, borderColor;

  if (scoreUpper === 'A' || scoreUpper === 'E') {
    bgColor = 'bg-yellow-100/80';
    textColor = 'text-yellow-800';
    borderColor = 'border-yellow-300/50';
  } else if (scoreUpper === 'B' || scoreUpper === 'D') {
    bgColor = 'bg-yellow-100/80';
    textColor = 'text-yellow-800';
    borderColor = 'border-yellow-300/50';
  } else if (scoreUpper === 'C') {
    bgColor = 'bg-orange-100/80';
    textColor = 'text-orange-800';
    borderColor = 'border-orange-300/50';
  } else {
    bgColor = 'bg-red-100/80';
    textColor = 'text-red-800';
    borderColor = 'border-red-300/50';
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
    lg: 'text-base px-5 py-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-2xl border backdrop-blur-sm shadow-md ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]}`}
    >
      <span className="font-semibold">{label}: {scoreUpper}</span>
    </div>
  );
}

