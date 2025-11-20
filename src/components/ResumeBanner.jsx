import { motion } from "framer-motion";

const ResumeBanner = ({ onResume, onStartFresh, savedState }) => {
  const hasSavedProgress = savedState?.completed_courses?.length > 0 || 
                           savedState?.selected_major;
  
  if (!hasSavedProgress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h3>
          <p className="text-gray-700 mb-4">
            We found your previous session. Would you like to continue where you left off?
          </p>
          
          {savedState?.selected_major && (
            <div className="text-sm text-gray-600 mb-2">
              <strong>Major:</strong> {savedState.selected_major.name} 
              {savedState.selected_major.concentration && ` - ${savedState.selected_major.concentration}`}
            </div>
          )}
          
          <div className="flex gap-2 text-sm text-gray-600">
            {savedState?.completed_courses?.length > 0 && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                {savedState.completed_courses.length} completed courses
              </div>
            )}
            {savedState?.in_progress_courses?.length > 0 && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                {savedState.in_progress_courses.length} in progress
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={onResume}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            Resume Session
          </button>
          <button
            onClick={onStartFresh}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeBanner;
