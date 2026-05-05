// src/components/ui/Badge.tsx
export const Badge = ({ 
  children, 
  color = 'blue' 
}: { 
  children: React.ReactNode, 
  color?: 'blue' | 'green' | 'amber' | 'gray' | 'purple' 
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    purple: "bg-purple-50 text-purple-600 border-purple-100"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[color]}`}>
      {children}
    </span>
  );
};