import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const MajorSelection = ({ onSelectMajor, selectedMajor }) => {
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/majors`)
      .then(res => res.json())
      .then(data => {
        // Add descriptions for each major/concentration
        const descriptionsMap = {
          "null": "General Computer Science degree with flexible electives",
          "Computer Systems": "Focus on computer architecture, operating systems, and networks",
          "Human-Centered Computing": "Focus on human-computer interaction, UI/UX, and design",
          "Software Engineering": "Focus on software development, design patterns, and engineering practices",
          "Design": "Interdisciplinary focus on design thinking and creative computing"
        };

        // Remove duplicates based on name and concentration
        const uniqueMajorsMap = new Map();
        data.forEach(major => {
          const key = `${major.name}-${major.concentration || 'null'}`;
          // Keep the first occurrence of each unique major/concentration combo
          if (!uniqueMajorsMap.has(key)) {
            uniqueMajorsMap.set(key, major);
          }
        });

        const uniqueMajors = Array.from(uniqueMajorsMap.values());

        const enrichedMajors = uniqueMajors.map(major => ({
          ...major,
          description: descriptionsMap[major.concentration || "null"] || "Computer Science degree"
        }));

        setMajors(enrichedMajors);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching majors:", err);
        setError("Failed to load majors");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Your Major</h1>
          <p className="text-gray-600">Loading majors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Your Major</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold mb-2">Choose Your Major</h1>
        <p className="text-gray-600">
          Select your major and concentration to see your course requirements
        </p>
      </motion.div>

      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {majors.map((major, idx) => (
          <motion.button
            key={major.id}
            onClick={() => onSelectMajor(major)}
            className="text-left p-6 rounded-2xl border-2 bg-white hover:border-black transition-all hover:shadow-lg"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-12 w-12 rounded-xl bg-black text-white grid place-items-center font-bold">
                CS
              </div>
              {selectedMajor?.id === major.id && (
                <span className="text-green-600 text-xl">✓</span>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-1">{major.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {major.concentration || "General"}
            </p>
            <p className="text-xs text-gray-500">{major.description}</p>
          </motion.button>
        ))}
      </motion.div>

      {selectedMajor && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button
            onClick={() => onSelectMajor(selectedMajor)}
            className="px-8 py-3 bg-black text-white rounded-xl hover:opacity-90 font-medium"
          >
            Continue with {selectedMajor.name}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MajorSelection;