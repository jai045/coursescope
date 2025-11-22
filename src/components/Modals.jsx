import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalShell from "./ModalShell";
import { Pill } from "./ui";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const highlightCourseCodes = (text) => {
  if (!text) return text;

  // Regex to match course codes like "CS 141", "MATH 180", etc.
  const courseCodeRegex = /\b([A-Z]{2,4})\s+(\d{3})\b/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = courseCodeRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the course code as a pill
    parts.push(
      <span
        key={match.index}
        className="inline-block px-2 py-0.5 mx-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-900 font-medium text-xs"
      >
        {match[0]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export const CourseDetailModal = ({ course, open, onClose }) => {
  // Get underline color based on course level
  const getUnderlineColor = (level) => {
    if (level <= 100) {
      return "border-green-300";
    } else if (level === 200) {
      return "border-lime-300";
    } else if (level === 300) {
      return "border-yellow-300";
    } else if (level >= 400) {
      return "border-red-300";
    }
    return "border-gray-300"; // fallback
  };

  const customTitle = course ? (
    <div className={`flex items-center gap-2 border-b-2 pb-2 ${getUnderlineColor(course.level)}`}>
      <span className="font-semibold">
        {course.code}
      </span>
      <span className="text-gray-500">—</span>
      <span className="font-semibold">Details</span>
    </div>
  ) : (
    "Course Details"
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={customTitle}
    >
      {course && (
        <div className="space-y-4">
        <div className="text-sm text-gray-700 leading-6">
          {highlightCourseCodes(course.description)}
        </div>
        <div className="flex gap-2 text-sm">
          <Pill type="credits" value={course.credits}>
            {course.creditsUndergrad !== undefined && course.creditsGrad !== undefined && course.creditsUndergrad !== course.creditsGrad
              ? `${course.creditsUndergrad}/${course.creditsGrad} Credits`
              : `${course.credits} credit${course.credits !== 1 ? "s" : ""}`
            }
          </Pill>
          <Pill type="level" value={course.level}>
            Level {course.level}
          </Pill>
          <Pill type="difficulty" value={course.difficulty}>
            {course.difficulty}
          </Pill>
        </div>
        <div className="text-sm">
          <span className="font-medium">Prerequisites:</span>{" "}
          {course.prerequisiteGroups && course.prerequisiteGroups.length > 0 ? (
            <span className="inline-flex flex-wrap gap-1 items-center">
              {course.prerequisiteGroups.map((group, groupIdx) => (
                <span key={groupIdx} className="inline-flex flex-wrap items-center gap-1">
                  {group.length > 1 && <span className="text-gray-500 text-xs">(</span>}
                  {group.map((prereq, prereqIdx) => (
                    <span key={prereqIdx} className="inline-flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-900 font-medium text-xs">
                        {prereq}
                      </span>
                      {prereqIdx < group.length - 1 && (
                        <span className="text-gray-500 text-xs">or</span>
                      )}
                    </span>
                  ))}
                  {group.length > 1 && <span className="text-gray-500 text-xs">)</span>}
                  {groupIdx < course.prerequisiteGroups.length - 1 && (
                    <span className="text-gray-700 text-xs font-semibold mx-1">and</span>
                  )}
                </span>
              ))}
            </span>
          ) : (
            "None"
          )}
        </div>
      </div>
    )}
    </ModalShell>
  );
};

const GradeBar = ({ label, percentage, count, color, delay = 0 }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 text-sm font-semibold text-gray-700">{label}</div>
    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative flex items-center">
      <motion.div
        className={`h-full ${color} absolute left-0 top-0`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(percentage, 3)}%` }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          delay: delay
        }}
      />
      <motion.span
        className="absolute right-3 text-black text-xs font-semibold whitespace-nowrap z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.3,
          delay: delay + 0.4
        }}
      >
        {percentage}%
      </motion.span>
    </div>
    <motion.div
      className="w-24 text-right text-sm text-gray-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.3,
        delay: delay + 0.4
      }}
    >
      {count} Student{count !== 1 ? 's' : ''}
    </motion.div>
  </div>
);

export const GradeDistributionModal = ({ course, open, onClose }) => {
  const [gradeData, setGradeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDistribution, setSelectedDistribution] = useState(null); // Store selected {semester, instructor, index}

  // Helper function to format instructor name
  const formatInstructorName = (instructor) => {
    if (!instructor || instructor.trim() === '' || instructor.trim() === ',' || instructor === 'null' || instructor === 'undefined') {
      return 'Instructor Not Specified';
    }
    return instructor;
  };

  useEffect(() => {
    if (open && course) {
      fetchGradeData();
      setSelectedDistribution(null); // Reset when modal opens
    }
  }, [open, course]);

  const fetchGradeData = async () => {
    if (!course) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/grades?code=${encodeURIComponent(course.code)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGradeData(data);
    } catch (err) {
      console.error("Error fetching grade data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group distributions by semester
  const getBySemester = () => {
    if (!gradeData || !gradeData.has_data) return {};

    const semesterMap = {};
    gradeData.distributions.forEach((dist, idx) => {
      const semester = dist.semester;
      if (!semesterMap[semester]) {
        semesterMap[semester] = [];
      }
      semesterMap[semester].push({
        ...dist,
        instructor: formatInstructorName(dist.instructor),
        index: idx
      });
    });

    // Sort semesters descending (most recent first)
    const sortedSemesters = Object.keys(semesterMap).sort().reverse();
    const sorted = {};
    sortedSemesters.forEach(sem => {
      sorted[sem] = semesterMap[sem].sort((a, b) => a.instructor.localeCompare(b.instructor));
    });

    return sorted;
  };

  const getDisplayData = () => {
    if (!selectedDistribution) {
      return {
        title: "Average Across All Data",
        data: gradeData?.average,
        subtitle: gradeData?.average ? `Based on ${gradeData.average.semesters_count} semester${gradeData.average.semesters_count !== 1 ? 's' : ''} (${gradeData.average.total_students} total students)` : null
      };
    }

    const dist = gradeData.distributions[selectedDistribution.index];
    const letterGradeTotal = dist.grades.A + dist.grades.B + dist.grades.C + dist.grades.D + dist.grades.F;
    
    return {
      title: selectedDistribution.semester,
      instructor: selectedDistribution.instructor,
      data: {
        grades: dist.grades,
        percentages: {
          A: letterGradeTotal > 0 ? Math.round((dist.grades.A / letterGradeTotal) * 1000) / 10 : 0,
          B: letterGradeTotal > 0 ? Math.round((dist.grades.B / letterGradeTotal) * 1000) / 10 : 0,
          C: letterGradeTotal > 0 ? Math.round((dist.grades.C / letterGradeTotal) * 1000) / 10 : 0,
          D: letterGradeTotal > 0 ? Math.round((dist.grades.D / letterGradeTotal) * 1000) / 10 : 0,
          F: letterGradeTotal > 0 ? Math.round((dist.grades.F / letterGradeTotal) * 1000) / 10 : 0,
          W: dist.total_students > 0 ? Math.round((dist.grades.W / dist.total_students) * 1000) / 10 : 0,
        },
        total_students: dist.total_students
      },
      subtitle: `${dist.total_students} students`
    };
  };

  const displayData = gradeData && gradeData.has_data ? getDisplayData() : null;

  // Get underline color based on course level
  const getUnderlineColorForGrades = (level) => {
    if (level <= 100) {
      return "border-green-300";
    } else if (level === 200) {
      return "border-lime-300";
    } else if (level === 300) {
      return "border-yellow-300";
    } else if (level >= 400) {
      return "border-red-300";
    }
    return "border-gray-300"; // fallback
  };

  const customTitle = course ? (
    <div className={`flex items-center gap-2 border-b-2 pb-2 ${getUnderlineColorForGrades(course.level)}`}>
      <span className="font-semibold">
        {course.code}
      </span>
      <span className="text-gray-500">—</span>
      <span className="font-semibold">Grade Distribution</span>
    </div>
  ) : (
    "Grade Distribution"
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={customTitle}
    >
      {course && (
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-600">Loading grade data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <p className="font-semibold">Error loading grade data</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && gradeData && !gradeData.has_data && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <p className="text-gray-700 font-medium">No grade data available</p>
              <p className="text-sm text-gray-600 mt-2">
                Grade distribution data has not been imported for this course yet.
              </p>
            </div>
          )}

          {!loading && !error && gradeData && gradeData.has_data && (
            <div className="flex gap-6 h-full min-h-0">
              {/* Left Side: Semester Selection */}
              <div className="w-[300px] flex-shrink-0 space-y-4 overflow-y-auto pr-4 border-r">
                {/* Overall Average Button */}
                <motion.button
                  onClick={() => setSelectedDistribution(null)}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    selectedDistribution === null
                      ? "bg-black text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📊 Overall Average
                </motion.button>

                {/* Semester-based Selection */}
                <div className="space-y-4">
                  {Object.entries(getBySemester()).map(([semester, distributions], semesterIdx) => (
                    <div key={semester} className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-700 px-1">
                        {semester}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                      {distributions.map((dist, distIdx) => {
                        const isSelected = 
                          selectedDistribution?.semester === dist.semester &&
                          selectedDistribution?.instructor === dist.instructor &&
                          selectedDistribution?.index === dist.index;
                        
                        return (
                          <motion.button
                            key={distIdx}
                            onClick={() => setSelectedDistribution({
                              semester: dist.semester,
                              instructor: dist.instructor,
                              index: dist.index
                            })}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-rose-500 text-white shadow-md"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: semesterIdx * 0.05 + distIdx * 0.02 }}
                          >
                            Instructor: {dist.instructor}
                          </motion.button>
                        );
                      })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Grade Distribution Chart */}
              <div className="flex-1 flex items-start justify-center min-h-0 py-2">
                {displayData && (
                <motion.div
                  className="space-y-3 w-full max-w-3xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">{displayData.title}</h4>
                    {displayData.subtitle && (
                      <p className="text-xs text-gray-600 mt-0.5">{displayData.subtitle}</p>
                    )}
                  </div>

                  <div className="space-y-2 bg-gray-50 rounded-xl p-4">
                    <GradeBar
                      label="A"
                      percentage={displayData.data.percentages.A}
                      count={displayData.data.grades.A}
                      color="bg-green-500"
                      delay={0}
                    />
                    <GradeBar
                      label="B"
                      percentage={displayData.data.percentages.B}
                      count={displayData.data.grades.B}
                      color="bg-lime-500"
                      delay={0.1}
                    />
                    <GradeBar
                      label="C"
                      percentage={displayData.data.percentages.C}
                      count={displayData.data.grades.C}
                      color="bg-yellow-500"
                      delay={0.2}
                    />
                    <GradeBar
                      label="D"
                      percentage={displayData.data.percentages.D}
                      count={displayData.data.grades.D}
                      color="bg-orange-500"
                      delay={0.3}
                    />
                    <GradeBar
                      label="F"
                      percentage={displayData.data.percentages.F}
                      count={displayData.data.grades.F}
                      color="bg-red-500"
                      delay={0.4}
                    />
                    {displayData.data.grades.W > 0 && (
                      <GradeBar
                        label="W"
                        percentage={displayData.data.percentages.W}
                        count={displayData.data.grades.W}
                        color="bg-gray-400"
                        delay={0.5}
                      />
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="flex gap-2 flex-wrap">
                    <Pill>
                      A/B Rate: {(displayData.data.percentages.A + displayData.data.percentages.B).toFixed(1)}%
                    </Pill>
                    <Pill>
                      Pass Rate: {(100 - displayData.data.percentages.F - displayData.data.percentages.W).toFixed(1)}%
                    </Pill>
                    {displayData.data.grades.W > 0 && (
                      <Pill>
                        Withdrawal: {displayData.data.percentages.W}%
                      </Pill>
                    )}
                  </div>
                </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
};