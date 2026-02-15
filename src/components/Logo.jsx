// Reusable Logo Component for MedFlix
// Cute narwhal character logo

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    xs: { img: 'w-8 h-8', text: 'text-sm' },
    sm: { img: 'w-10 h-10', text: 'text-base' },
    md: { img: 'w-12 h-12', text: 'text-2xl' },
    lg: { img: 'w-16 h-16', text: 'text-3xl' },
    xl: { img: 'w-20 h-20', text: 'text-4xl' },
  }

  const s = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/narwhal-logo.png"
        alt="MedFlix Logo"
        className={`${s.img} object-contain`}
      />
      
      {showText && (
        <span className={`${s.text} font-black text-gray-900`}>
          MedFlix
        </span>
      )}
    </div>
  )
}
