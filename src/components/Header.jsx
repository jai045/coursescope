import { motion } from "framer-motion";
import icon from "../assets/icon.png";
import { supabase, SUPABASE_ENABLED } from "../lib/supabaseClient";

const Header = ({ onChangeMajor, selectedMajor, onAuthOpen, user }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
  <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
    <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2 group" aria-label="Go to home">
        <div className="flex items-center gap-3">
          <img src={icon} alt="CourseScope Icon" className="h-14 w-14 md:h-16 md:w-16 object-contain" />
          <span className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-black via-gray-700 to-gray-500">
            CourseScope
          </span>
        </div>
      </a>
      <div className="flex items-center gap-4">
        {selectedMajor && (
          <div className="text-xs text-gray-600">
            {selectedMajor.name} · {selectedMajor.concentration}
          </div>
        )}
        {onChangeMajor && (
          <button
            onClick={onChangeMajor}
            className="relative text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-black font-medium transition-colors overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: "linear-gradient(90deg, #fef3c7, #fde68a, #fcd34d, #fbbf24, #fde68a, #fef3c7)",
                backgroundSize: "200% 100%"
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "linear-gradient(90deg, #ddd6fe, #c4b5fd, #a78bfa, #8b5cf6, #c4b5fd, #ddd6fe)",
                backgroundSize: "200% 100%"
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "linear-gradient(90deg, #bfdbfe, #93c5fd, #60a5fa, #3b82f6, #93c5fd, #bfdbfe)",
                backgroundSize: "200% 100%"
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <span className="relative z-10">Change Major</span>
          </button>
        )}
        {!SUPABASE_ENABLED ? (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">Auth not configured</div>
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{user.email}</span>
            <button onClick={handleSignOut} className="text-xs px-3 py-1.5 rounded-lg border hover:border-gray-300">Sign out</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => onAuthOpen("login")} className="text-xs px-3 py-1.5 rounded-lg border hover:border-gray-300">Log in</button>
            <button onClick={() => onAuthOpen("signup")} className="text-xs px-3 py-1.5 rounded-lg border hover:border-gray-300">Sign up</button>
          </div>
        )}
        <span className="text-xs text-gray-500">MVP · Unified course planning</span>
      </div>
    </div>
  </header>
  );
};

export default Header;