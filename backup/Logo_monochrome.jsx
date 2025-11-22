import { motion } from 'framer-motion';

// Monochrome animated CourseScope logo (backup version)
export default function LogoMonochrome({ className = 'h-14 w-14 md:h-16 md:w-16' }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 2, -2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      aria-label="CourseScope monochrome logo"
      role="img"
    >
      <defs>
        <radialGradient id="grad-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f8f9fa" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </radialGradient>
        <linearGradient id="grad-accent" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f0f10" />
          <stop offset="45%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="grad-handle" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="grad-node" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#grad-bg)" stroke="#cbd5e1" strokeWidth="2" />
      <motion.path
        d="M16 22 L32 14 L48 22 L32 30 Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1.5"
        initial={{ y: 0 }}
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path d="M32 30 L34 38" stroke="url(#grad-accent)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="38" r="2.4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <circle cx="32" cy="38" r="14" stroke="url(#grad-accent)" strokeWidth="2.2" fill="none" />
      <circle cx="32" cy="38" r="4.2" fill="#ffffff" stroke="url(#grad-node)" strokeWidth="1.4" />
      <circle cx="24" cy="38" r="2.2" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
      <circle cx="40" cy="38" r="2.2" fill="#ffffff" stroke="#475569" strokeWidth="1.2" />
      <circle cx="32" cy="46" r="2.2" fill="#ffffff" stroke="#475569" strokeWidth="1.2" />
      <circle cx="32" cy="30" r="2.2" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
      <path d="M32 34 L32 34" stroke="#64748b" />
      <path d="M32 34 L24 38" stroke="#64748b" strokeWidth="1" />
      <path d="M32 34 L40 38" stroke="#475569" strokeWidth="1" />
      <path d="M32 42 L32 46" stroke="#475569" strokeWidth="1" />
      <path d="M43 49 L50 56" stroke="url(#grad-handle)" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 28 C14 18 22 10 32 10" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    </motion.svg>
  );
}
