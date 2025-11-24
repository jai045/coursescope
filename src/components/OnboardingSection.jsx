import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

const OnboardingSection = ({
  courses = [],
  onComplete,
  completedCourses,
  isCollapsed: externalCollapsed,
  setIsCollapsed: setExternalCollapsed,
  title = "Completed Courses", // New prop with default value
  description = "Choose all courses you've already completed to see which courses you're eligible for.", // New prop with default value
  buttonText = "Confirm", // New prop with default value
  excludeCourses = new Set(), // New prop to exclude courses from selection
  showCompletedFirst = false, // New prop to show completed/excluded courses at top
  enforcePrerequisites = false, // New prop to filter by prerequisites
  completedCoursesSet = new Set() // New prop for prerequisite checking
}) => {
  const [completed, setCompleted] = useState(completedCourses || new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(50); // Incremental loading
  const isCollapsed = externalCollapsed ?? (completedCourses !== null);

  // Update internal state when completedCourses prop changes
  useEffect(() => {
    if (completedCourses) {
      console.log(`[OnboardingSection - ${title}] Updating completed state:`, Array.from(completedCourses));
      setCompleted(completedCourses);
    }
  }, [completedCourses, title]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery]);

  // Filter courses based on prerequisites if enforcePrerequisites is true
  const eligibleCourses = useMemo(() => {
    if (!enforcePrerequisites) {
      return courses;
    }

    return courses.filter(course => {
      // Courses with no prerequisites are always eligible
      if (!course.prerequisiteGroups || course.prerequisiteGroups.length === 0) {
        return true;
      }

      // Check grouped prerequisites (AND between groups, OR within groups)
      const completedArray = Array.from(completedCoursesSet);
      for (const group of course.prerequisiteGroups) {
        const groupMet = group.some(prereq => completedArray.includes(prereq));
        if (!groupMet) {
          return false; // All groups must be satisfied
        }
      }
      return true;
    });
  }, [courses, enforcePrerequisites, completedCoursesSet]);

  // Filter courses to exclude those already in excludeCourses set
  let availableCourses = eligibleCourses.filter(course => !excludeCourses.has(course.code));

  // Apply search filter
  if (searchQuery.trim()) {
    availableCourses = availableCourses.filter(course =>
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Separate excluded courses if showCompletedFirst is true
  const excludedCourses = showCompletedFirst
    ? courses.filter(course => excludeCourses.has(course.code))
    : [];

  const toggleCourse = (courseCode) => {
    setCompleted((prev) => {
      const n = new Set(prev);
      n.has(courseCode) ? n.delete(courseCode) : n.add(courseCode);
      return n;
    });
  };

  const handleConfirm = () => {
    onComplete(completed);
    if (setExternalCollapsed) setExternalCollapsed(true);
  };

  const handleEdit = () => {
    if (setExternalCollapsed) setExternalCollapsed(false);
  };

  return (
    <>
    <motion.div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div layout className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {isCollapsed ? title : `Select ${title}`}
            </h2>
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.p
                  key="collapsed"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-gray-600 mt-1"
                >
                  {completed.size} course{completed.size !== 1 ? "s" : ""} selected
                </motion.p>
              ) : (
                <motion.p
                  key="expanded"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-gray-600 mt-1"
                >
                  {description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isCollapsed ? handleEdit : handleConfirm}
            className="px-4 py-2 bg-black text-white rounded-xl hover:opacity-90"
          >
            {isCollapsed ? "Edit" : buttonText}
          </motion.button>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 p-2 border rounded-xl flex-shrink-0">
                  {/* Show excluded/completed courses first if showCompletedFirst is true */}
                  {showCompletedFirst && excludedCourses.length > 0 && (
                    <>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                        Completed Courses
                      </div>
                      {excludedCourses
                        .sort((a, b) => {
                          const numA = parseInt(a.code.match(/\d+/)?.[0] || '0');
                          const numB = parseInt(b.code.match(/\d+/)?.[0] || '0');
                          return numA - numB;
                        })
                        .map((course) => (
                          <div
                            key={course.id}
                            className="flex items-start gap-3 p-3 rounded-xl border bg-green-50 border-green-200"
                          >
                            <div className="mt-1 h-4 w-4 flex items-center justify-center">
                              <div className="h-3 w-3 rounded-sm bg-green-600"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-green-900">{course.code}</span>
                                <span className="text-sm text-green-700">•</span>
                                <span className="text-sm text-green-900">{course.title}</span>
                              </div>
                              <div className="text-xs text-green-700 mt-1">
                                {course.credits} credits · Level {course.level}
                              </div>
                            </div>
                          </div>
                        ))}

                      {availableCourses.length > 0 && (
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 mt-4">
                          Available Courses
                        </div>
                      )}
                    </>
                  )}

                  {/* Available courses for selection */}
                  {availableCourses
                    .sort((a, b) => {
                      // Extract numbers from course codes (e.g., "CS 141" -> 141)
                      const numA = parseInt(a.code.match(/\d+/)?.[0] || '0');
                      const numB = parseInt(b.code.match(/\d+/)?.[0] || '0');
                      return numA - numB;
                    })
                    .slice(0, visibleCount)
                    .map((course) => (
                    <label
                      key={course.id}
                      className="flex items-start gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={completed.has(course.code)}
                        onChange={() => toggleCourse(course.code)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{course.code}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm">{course.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {course.credits} credits · Level {course.level}
                        </div>
                      </div>
                    </label>
                  ))}

                  {availableCourses.length === 0 && !showCompletedFirst && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No courses found matching "{searchQuery}"
                    </div>
                  )}

                  {/* Load More Button */}
                  {visibleCount < availableCourses.length && (
                    <motion.button
                      onClick={() => setVisibleCount(prev => prev + 50)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-2 p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Load More ({availableCourses.length - visibleCount} remaining)
                    </motion.button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    {completed.size} course{completed.size !== 1 ? "s" : ""} selected
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>

    {/* Checked Courses Display - Shows when editing (not collapsed) */}
    <AnimatePresence>
      {!isCollapsed && completed.size > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="mt-3 bg-white rounded-2xl border shadow-sm overflow-hidden"
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Currently Selected
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(completed).sort().map((courseCode) => {
                const course = courses.find(c => c.code === courseCode);
                if (!course) return null;

                return (
                  <motion.div
                    key={courseCode}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group relative flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-900">
                        {courseCode}
                      </span>
                      <span className="text-[10px] text-gray-600 line-clamp-1">
                        {course.title}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleCourse(courseCode)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                      title="Remove course"
                    >
                      <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default OnboardingSection;
