const points = [18, 18, 18, 18, 18, 18, 18];
const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function RevenueChart() {
  const polyline = points.map((value, index) => `${index * (100 / 6)},${58 - value}`).join(' ');
  return (
    <div className="relative mt-6 min-h-64">
      <svg viewBox="0 0 100 62" preserveAspectRatio="none" role="img" aria-labelledby="revenue-chart-title revenue-chart-desc" className="h-56 w-full overflow-visible">
        <title id="revenue-chart-title">Son yedi gün satış grafiği</title>
        <desc id="revenue-chart-desc">Henüz sipariş olmadığı için tüm günlerde satış değeri sıfırdır.</desc>
        {[8, 23, 38, 53].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--border)" strokeWidth="0.28" vectorEffect="non-scaling-stroke" />)}
        <defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--chart-1)" stopOpacity="0.2" /><stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" /></linearGradient></defs>
        <polygon points={`0,58 ${polyline} 100,58`} fill="url(#revenue-fill)" />
        <polyline points={polyline} fill="none" stroke="var(--chart-1)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        {points.map((value, index) => <circle key={labels[index]} cx={index * (100 / 6)} cy={58 - value} r="1.15" fill="var(--card)" stroke="var(--chart-1)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div className="grid grid-cols-7 border-t border-border pt-3 text-center text-[0.66rem] text-muted-foreground">{labels.map((label) => <span key={label}>{label}</span>)}</div>
      <div className="pointer-events-none absolute inset-x-0 top-20 text-center"><p className="text-xs font-medium text-muted-foreground">İlk sipariş bekleniyor</p></div>
    </div>
  );
}
