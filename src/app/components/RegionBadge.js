export default function RegionBadge({ region }) {
  const getRegionColor = (reg) => {
    switch (reg?.toUpperCase()) {
      case 'NA':
        return 'bg-red-950/80 text-red-400 border-red-800/50';
      case 'EU':
        return 'bg-blue-950/80 text-blue-400 border-blue-800/50';
      case 'AS':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/50';
      case 'AU':
        return 'bg-green-950/80 text-green-400 border-green-800/50';
      case 'SA':
        return 'bg-purple-950/80 text-purple-400 border-purple-800/50';
      default:
        return 'bg-gray-900 text-gray-400 border-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-bold border ${getRegionColor(region)}`}>
      {region || 'N/A'}
    </span>
  );
}
