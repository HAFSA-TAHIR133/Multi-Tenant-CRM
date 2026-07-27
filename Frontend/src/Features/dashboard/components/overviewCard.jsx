import StatCard from './statCard';

export default function OverviewCards({ cards = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value ?? 0}
          description={card.description}
          icon={card.icon}
        />
      ))}
    </div>
  );
}