interface SeparatorProps {
  className?: string;
}

export function Separator({ className = '' }: SeparatorProps) {
  return (
    <div className={`my-6 border-t border-gray-200 dark:border-gray-700 ${className}`} />
  );
}