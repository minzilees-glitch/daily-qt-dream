export function StatRow({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[20px] bg-ivory/80 px-3 py-3 text-center shadow-none backdrop-blur"
        >
          <p className="text-[11px] font-medium text-text-secondary">{item.label}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-text-main">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
