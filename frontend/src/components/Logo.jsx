import logoSrc from '../assets/logo.png';

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-16 w-16',
};

export { logoSrc };

export default function Logo({ size = 'md', className = '', showText = false, textClassName = '' }) {
  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <img
        src={logoSrc}
        alt="FacePass"
        className={`${SIZES[size] || SIZES.md} object-contain shrink-0`}
      />
      {showText && (
        <div className={`text-left min-w-0 ${textClassName}`}>
          <p className="font-bold text-sm sm:text-base m-0 truncate leading-tight">FacePass</p>
          <p className="text-[10px] sm:text-xs text-[var(--primary-600)] m-0 truncate font-medium">Điểm danh thi trực tuyến</p>
        </div>
      )}
    </div>
  );
}
