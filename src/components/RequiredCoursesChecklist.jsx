import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const RequiredCoursesChecklist = ({
  requiredCourses,
  electiveCourses,
  completedCourses,
  inProgressCourses, // New prop for in-progress courses
  selectedCourses,
  onCourseClick,
  isEditingCompleted = false,
  collapsed,
  setCollapsed,
  summaryGroups = [] // New prop for hour requirement buckets
}) => {
  const [expandedTypes, setExpandedTypes] = useState(new Set(["Core Courses", "General and Basic Education Requirements"]));
  const [expandedElectives, setExpandedElectives] = useState(new Set());

  // Helper function to format category names
  const formatCategoryName = (type) => {
    if (type === "Core CS") return "Required Courses";
    if (type === "CS Electives") return "Electives";
    return type;
  };


  if ((!requiredCourses || requiredCourses.length === 0) && (!electiveCourses || electiveCourses.length === 0)) {
    return null;
  }

  // Convert completed and in-progress courses Sets to Arrays for easier checking
  const completedCodesArray = completedCourses ? Array.from(completedCourses) : [];
  const inProgressCodesArray = inProgressCourses ? Array.from(inProgressCourses) : []; // Convert in-progress courses to array
  const selectedCodesArray = selectedCourses ? selectedCourses.map(c => c.code) : [];

  // Map requirement types to catalog sections
  const mapToSection = (course) => {
    const type = course.requirementType || "Other";
    const code = course.code || "";
    
    // Map based on requirement type and course prefix
    if (type.includes("English") || type.includes("Science") || 
        code.startsWith("ENGL") || code.startsWith("BIOS") || 
        code.startsWith("CHEM") || code.startsWith("PHYS") || 
        code.startsWith("EAES") ||
        type.includes("General Education")) {
      return "General and Basic Education Requirements";
    }
    if (type.includes("Math") || type.includes("Stat") || 
        code.startsWith("MATH") || code.startsWith("STAT") || 
        code.startsWith("IE")) {
      return "Required Mathematics Courses";
    }
    if (type.includes("CS") || type.includes("Data/CS") || 
        code.startsWith("CS") || code.startsWith("IDS") || 
        code.startsWith("ENGR")) {
      return "Core Courses";
    }
    return "Other Requirements";
  };

  // Group courses by catalog section
  const coursesBySection = requiredCourses.reduce((acc, course) => {
    const section = mapToSection(course);
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(course);
    return acc;
  }, {});

  // Define section order to match catalog
  const sectionOrder = [
    "General and Basic Education Requirements",
    "Core Courses", 
    "Required Mathematics Courses",
    "Other Requirements"
  ];

  const toggleType = (type) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const toggleElectiveType = (type) => {
    setExpandedElectives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Group electives by catalog section
  const electivesBySection = electiveCourses ? electiveCourses.reduce((acc, course) => {
    const type = course.electiveType || "Other Electives";
    let section = type;
    
    // Map elective types to catalog sections
    if (type.includes("CS Electives") || type.includes("Technical")) {
      section = "Computer Science Concentration Requirements";
    } else if (type.includes("Math")) {
      section = "Required Mathematics Courses";
    } else if (type.includes("Science")) {
      section = "Science Electives";
    } else {
      section = "Free Electives";
    }
    
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(course);
    return acc;
  }, {}) : {};

  // Calculate overall progress (only for required courses)
  const totalRequired = requiredCourses ? requiredCourses.length : 0;
  const totalCompleted = requiredCourses ? requiredCourses.filter(c =>
    completedCodesArray.includes(c.code)
  ).length : 0;
  const totalInPlan = requiredCourses ? requiredCourses.filter(c =>
    selectedCodesArray.includes(c.code) && !completedCodesArray.includes(c.code)
  ).length : 0;
  const progressPercentage = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

  return (
    <motion.div
      animate={{
        width: isEditingCompleted ? "0px" : (collapsed ? "60px" : "384px"),
        borderRightWidth: isEditingCompleted ? "0px" : "2px"
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className="bg-white border-r-2 border-gray-200 h-full overflow-hidden flex flex-col"
    >
      {!isEditingCompleted && (
        <>
          {collapsed ? (
            /* Collapsed State - Show only hamburger button */
            <div className="flex items-center justify-center pt-24">
              <motion.button
                onClick={() => setCollapsed(false)}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex flex-col gap-1">
                  <div className="w-6 h-0.5 bg-gray-700"></div>
                  <div className="w-6 h-0.5 bg-gray-700"></div>
                  <div className="w-6 h-0.5 bg-gray-700"></div>
                </div>
              </motion.button>
            </div>
          ) : (
            /* Expanded State - Show full sidebar content */
            <>
              {/* Header */}
              <div className="p-4 border-b-2 border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Requirements Checklist</h2>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-500 hover:text-black text-xl"
          >
            ←
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{totalCompleted} completed</span>
            <span>{totalInPlan} in plan</span>
            <span>{totalRequired - totalCompleted - totalInPlan} remaining</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-center text-gray-600 font-semibold">
            {progressPercentage}% Complete
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Summary of Requirements */}
        {summaryGroups && summaryGroups.length > 0 && (
          <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <h3 className="font-bold text-sm mb-2 text-blue-900">Summary of Requirements</h3>
            <div className="space-y-1">
              {summaryGroups.map((group, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-700">{group.name}</span>
                  <span className="font-semibold text-gray-900">
                    {group.minHours === group.maxHours 
                      ? group.minHours 
                      : `${group.minHours}-${group.maxHours}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Courses Section */}
        {requiredCourses && requiredCourses.length > 0 && sectionOrder.map(section => {
          const courses = coursesBySection[section];
          if (!courses || courses.length === 0) return null;
          
          const isExpanded = expandedTypes.has(section);
          const typeCompleted = courses.filter(c => completedCodesArray.includes(c.code)).length;
          const typeInPlan = courses.filter(c =>
            selectedCodesArray.includes(c.code) && !completedCodesArray.includes(c.code)
          ).length;

          return (
            <div key={section} className="space-y-2">
              {/* Type Header */}
              <button
                onClick={() => toggleType(section)}
                className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
                  <span className="font-semibold text-sm">{section}</span>
                  <span className="text-xs text-gray-500">
                    ({typeCompleted}/{courses.length})
                  </span>
                </div>
                <div className="flex gap-1">
                  {typeInPlan > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {typeInPlan} planned
                    </span>
                  )}
                </div>
              </button>

              {/* Course List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 pl-2"
                  >
                  {courses.map((course) => {
                    const isCompleted = completedCodesArray.includes(course.code);
                    const isInProgress = inProgressCodesArray.includes(course.code); // Check if course is in progress
                    const isInPlan = selectedCodesArray.includes(course.code);
                    const status = isCompleted ? "completed" : isInProgress ? "in-progress" : isInPlan ? "planned" : "pending"; // Add in-progress status

                    return (
                      <motion.button
                        key={course.code}
                        onClick={() => onCourseClick && onCourseClick(course)}
                        className={`w-full text-left p-2 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                          status === "completed"
                            ? "bg-green-100 border-green-400"
                            : status === "in-progress"
                            ? "bg-blue-100 border-blue-400"
                            : status === "planned"
                            ? "bg-gray-50 border-gray-300"
                            : "bg-red-50 border-red-300"
                        }`}
                        whileHover={{ borderColor: "#000000" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-2">
                          {/* Course Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold">
                                {course.code}
                              </span>
                              <span className="text-xs text-gray-500">
                                {course.credits} Credit Hours
                              </span>
                            </div>
                            <div className="text-xs text-gray-700 line-clamp-1">
                              {course.title}
                            </div>

                            {/* Prerequisites Warning */}
                            {(status === "pending" || status === "in-progress") && course.prerequisiteGroups && course.prerequisiteGroups.length > 0 && (
                              <div className="mt-1">
                                <div className="text-[10px] text-gray-500 mb-0.5">
                                  Prereq:
                                </div>
                                <div className="flex flex-wrap gap-x-1 gap-y-1 items-center">
                                  {course.prerequisiteGroups.map((group, groupIdx) => (
                                    <span key={groupIdx} className="inline-flex flex-wrap items-center gap-1">
                                      {group.length > 1 && <span className="text-[10px] text-gray-400">(</span>}
                                      {group.map((prereq, prereqIdx) => {
                                        const isPrereqCompleted = completedCodesArray.includes(prereq);
                                        const isPrereqInProgress = inProgressCodesArray.includes(prereq); // Check if prereq is in progress
                                        const prereqStatusClass = isPrereqCompleted
                                          ? "bg-green-50 border-green-300 text-green-700"
                                          : isPrereqInProgress
                                          ? "bg-blue-50 border-blue-300 text-blue-700" // Light blue for in-progress
                                          : "bg-red-50 border-red-300 text-red-700";
                                        return (
                                          <span key={prereqIdx} className="inline-flex items-center gap-1">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${prereqStatusClass}`}>
                                              {prereq}
                                            </span>
                                            {prereqIdx < group.length - 1 && (
                                              <span className="text-[10px] text-gray-400">or</span>
                                            )}
                                          </span>
                                        );
                                      })}
                                      {group.length > 1 && <span className="text-[10px] text-gray-400">)</span>}
                                      {groupIdx < course.prerequisiteGroups.length - 1 && (
                                        <span className="text-[10px] font-semibold text-gray-600">and</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Electives Section */}
        {electiveCourses && electiveCourses.length > 0 && (
          <>
            {Object.entries(electivesBySection).map(([type, courses]) => {
              const isExpanded = expandedElectives.has(type);
              const typeCompleted = courses.filter(c => completedCodesArray.includes(c.code)).length;
              const typeInPlan = courses.filter(c =>
                selectedCodesArray.includes(c.code) && !completedCodesArray.includes(c.code)
              ).length;

              return (
                <div key={type} className="space-y-2">
                  {/* Type Header */}
                  <button
                    onClick={() => toggleElectiveType(type)}
                    className="w-full flex items-center justify-between p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
                      <span className="font-semibold text-sm">{type}</span>
                      <span className="text-xs text-gray-500">
                        ({courses.length} options)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {typeCompleted > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {typeCompleted} completed
                        </span>
                      )}
                      {typeInPlan > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {typeInPlan} planned
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Elective Course List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1 pl-2"
                      >
                      {courses.map((course) => {
                        const isCompleted = completedCodesArray.includes(course.code);
                        const isInProgress = inProgressCodesArray.includes(course.code); // Check if course is in progress
                        const isInPlan = selectedCodesArray.includes(course.code);
                        const status = isCompleted ? "completed" : isInProgress ? "in-progress" : isInPlan ? "planned" : "pending"; // Add in-progress status

                        return (
                          <motion.button
                            key={course.code}
                            onClick={() => onCourseClick && onCourseClick(course)}
                            className={`w-full text-left p-2 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                              status === "completed"
                                ? "bg-green-100 border-green-400"
                                : status === "in-progress"
                                ? "bg-blue-100 border-blue-400"
                                : status === "planned"
                                ? "bg-gray-50 border-gray-300"
                                : "bg-purple-50 border-purple-300"
                            }`}
                            whileHover={{ borderColor: "#000000" }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start gap-2">
                              {/* Course Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold">
                                    {course.code}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {course.credits}cr
                                  </span>
                                </div>
                                <div className="text-xs text-gray-700 line-clamp-1">
                                  {course.title}
                                </div>

                                {/* Prerequisites Warning */}
                                {(status === "pending" || status === "in-progress") && course.prerequisiteGroups && course.prerequisiteGroups.length > 0 && (
                                  <div className="mt-1">
                                    <div className="text-[10px] text-gray-500 mb-0.5">
                                      Prereq:
                                    </div>
                                    <div className="flex flex-wrap gap-x-1 gap-y-1 items-center">
                                      {course.prerequisiteGroups.map((group, groupIdx) => (
                                        <span key={groupIdx} className="inline-flex flex-wrap items-center gap-1">
                                          {group.length > 1 && <span className="text-[10px] text-gray-400">(</span>}
                                          {group.map((prereq, prereqIdx) => {
                                            const isPrereqCompleted = completedCodesArray.includes(prereq);
                                            const isPrereqInProgress = inProgressCodesArray.includes(prereq);
                                            const prereqStatusClass = isPrereqCompleted
                                              ? "bg-green-50 border-green-300 text-green-700"
                                              : isPrereqInProgress
                                              ? "bg-blue-50 border-blue-300 text-blue-700"
                                              : "bg-red-50 border-red-300 text-red-700";
                                            return (
                                              <span key={prereqIdx} className="inline-flex items-center gap-1">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${prereqStatusClass}`}>
                                                  {prereq}
                                                </span>
                                                {prereqIdx < group.length - 1 && (
                                                  <span className="text-[10px] text-gray-400">or</span>
                                                )}
                                              </span>
                                            );
                                          })}
                                          {group.length > 1 && <span className="text-[10px] text-gray-400">)</span>}
                                          {groupIdx < course.prerequisiteGroups.length - 1 && (
                                            <span className="text-[10px] font-semibold text-gray-600">and</span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t-2 border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-bold text-green-600">{totalCompleted}</div>
            <div className="text-gray-600">Completed</div>
          </div>
          <div>
            <div className="font-bold text-blue-600">{totalInPlan}</div>
            <div className="text-gray-600">In Plan</div>
          </div>
          <div>
            <div className="font-bold text-red-500">{totalRequired - totalCompleted - totalInPlan}</div>
            <div className="text-gray-600">Remaining</div>
          </div>
        </div>
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
};

export default RequiredCoursesChecklist;
