// src/components/ui/IconContainer.tsx
export const IconContainer = ({ 
  icon: Icon, 
//   color = 'blue', 
  size = 'md' 
}: { 
  icon: any, 
  color?: string, 
  size?: 'sm' | 'md' | 'lg' 
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 p-1 rounded",
    md: "w-10 h-10 p-2 rounded-lg",
    lg: "w-14 h-14 p-3 rounded-xl"
  };

  return (
    <div className={`${sizeClasses[size]} bg-white border border-gray-100 shadow-sm flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110`}>
      <Icon size={size === 'sm' ? 14 : size === 'md' ? 20 : 28} />
    </div>
  );
};