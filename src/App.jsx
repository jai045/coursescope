import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import ResumeBanner from "./components/ResumeBanner";
import { supabase } from "./lib/supabaseClient";
import FilterBar from "./components/FilterBar";
import EligibleCourses from "./components/EligibleCourses";
import PlanSummary from "./components/PlanSummary";
import { CourseDetailModal, GradeDistributionModal } from "./components/Modals";
import OnboardingSection from "./components/OnboardingSection";
import MajorSelection from "./components/MajorSelection";
import DiagnosticPanel from "./components/DiagnosticPanel";
import RequiredCoursesChecklist from "./components/RequiredCoursesChecklist";
import UploadAudit from "./components/UploadAudit";
import { useDebounce } from "./hooks/useDebounce";
import { loadUserState, saveUserState } from "./lib/userState";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function App() {
  const [search, setSearch] = useState("");
  const [levelFilters, setLevelFilters] = useState(new Set());
  const [difficultyFilters, setDifficultyFilters] = useState(new Set());
  const [creditsFilters, setCreditsFilters] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [majorConfirmed, setMajorConfirmed] = useState(false);
  const [requiredCourses, setRequiredCourses] = useState([]);
  const [electiveCourses, setElectiveCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState(null);
  const [inProgressCourses, setInProgressCourses] = useState(null); // New state for in-progress courses
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onboardingCollapsed, setOnboardingCollapsed] = useState(false);
  const [inProgressSelectionCollapsed, setInProgressSelectionCollapsed] = useState(true); // New state for in-progress modal
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [skippedPlanning, setSkippedPlanning] = useState(false); // Track if user skipped planning

  const [detailOpen, setDetailOpen] = useState(false);
  const [gradesOpen, setGradesOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  // Auth state
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [savedUserState, setSavedUserState] = useState(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  // Debounce search input to reduce filtering overhead
  const debouncedSearch = useDebounce(search, 300);
  const saveTimerRef = useRef(null);

  // Fetch all courses from API on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Initialize Supabase auth session and subscribe to changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user || null);
        if (session?.user) {
          try {
            const state = await loadUserState(session.user.id);
            if (state && (state.completed_courses?.length > 0 || state.selected_major)) {
              // User has saved state - show resume banner instead of auto-loading
              setSavedUserState(state);
              setShowResumeBanner(true);
            }
          } catch (e) {
            console.warn("Failed to load user state:", e.message);
          }
        }
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        try {
          const state = await loadUserState(session.user.id);
          if (state && (state.completed_courses?.length > 0 || state.selected_major)) {
            // User has saved state - show resume banner
            setSavedUserState(state);
            setShowResumeBanner(true);
          } else {
            // Fresh user state
            setSavedUserState(null);
            setShowResumeBanner(false);
            setCompletedCourses(null);
            setInProgressCourses(null);
          }
        } catch (e) {
          console.warn("Failed to load user state (auth change):", e.message);
        }
      } else {
        // Signed out: clear all state
        setSavedUserState(null);
        setShowResumeBanner(false);
        setSelectedMajor(null);
        setMajorConfirmed(false);
        setCompletedCourses(null);
        setInProgressCourses(null);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Debounced persistence of critical planning state
  useEffect(() => {
    if (!user) return; // only persist when authenticated
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveUserState(user.id, {
        selectedMajor,
        completedCourses,
        inProgressCourses,
      }).catch(e => console.warn('Persist user state failed:', e.message));
    }, 800); // slight delay to batch rapid changes
    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
  }, [user, selectedMajor, completedCourses, inProgressCourses]);

  // Collapse sidebar when entering edit mode (onboarding expanded)
  useEffect(() => {
    if (!onboardingCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [onboardingCollapsed]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/courses`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAllCourses(data);
      console.log("✓ Loaded courses:", data.length);
    } catch (error) {
      console.error("✗ Error fetching courses:", error);
      setAllCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMajorSelect = async (major) => {
    setSelectedMajor(major);
    setMajorConfirmed(true);

    // Fetch required courses for this major
    try {
      const response = await fetch(`${API_URL}/majors/${major.id}/requirements`);
      const data = await response.json();
      setRequiredCourses(data.requiredCourses);
      setElectiveCourses(data.electiveCourses || []);
      console.log("✓ Loaded major requirements:", data.requiredCourses.length);
      console.log("✓ Loaded elective courses:", data.electiveCourses?.length || 0);
    } catch (error) {
      console.error("✗ Error fetching major requirements:", error);
    }
  };

  const handleChangeMajor = () => {
    setMajorConfirmed(false);
    setCompletedCourses(null);
    setInProgressCourses(null); // Reset to null to show onboarding for new major
    setOnboardingCollapsed(false);
    setInProgressSelectionCollapsed(true); // Reset in-progress modal state
    setSelected([]);
    setSkippedPlanning(false); // Reset skipped planning state
    // Don't reset requiredCourses and electiveCourses - they will be fetched when a new major is selected
  };

  const handleSkipPlanning = () => {
    // Skip the planning process and go straight to browsing courses
    setCompletedCourses(new Set());
    setInProgressCourses(new Set());
    setOnboardingCollapsed(true); // Collapse both sections
    setInProgressSelectionCollapsed(true);
    setMajorConfirmed(true);
    setSkippedPlanning(true); // Mark that planning was skipped
  };

  const handleOnboardingComplete = (completed) => {
    console.log("📋 Completed courses received:", completed);
    console.log("📋 Type:", completed instanceof Set ? "Set" : Array.isArray(completed) ? "Array" : typeof completed);
    console.log("📋 Size/Length:", completed.size || completed.length);
    console.log("📋 Values:", Array.from(completed));
    setCompletedCourses(completed);
    setInProgressCourses(new Set()); // Initialize in-progress as empty Set instead of null
    setOnboardingCollapsed(true);
    setInProgressSelectionCollapsed(false); // Show in-progress modal after onboarding
  };

  const handleInProgressComplete = (inProgress) => {
    console.log("📋 In-progress courses received:", inProgress);
    setInProgressCourses(inProgress);
    setInProgressSelectionCollapsed(true); // Collapse in-progress modal
  };

  const handleResumeSession = async () => {
    if (!savedUserState) return;
    
    // Load the saved state
    if (savedUserState.selected_major) {
      await handleMajorSelect(savedUserState.selected_major);
    }
    setCompletedCourses(new Set(savedUserState.completed_courses || []));
    setInProgressCourses(new Set(savedUserState.in_progress_courses || []));
    
    // Auto-collapse onboarding if user has saved progress
    if (savedUserState.completed_courses && savedUserState.completed_courses.length > 0) {
      setOnboardingCollapsed(true);
      setInProgressSelectionCollapsed(true);
    }
    
    setShowResumeBanner(false);
  };

  const handleStartFresh = () => {
    // Start with a clean slate but keep the saved state in case they want to resume later
    setCompletedCourses(null);
    setInProgressCourses(null);
    setSelectedMajor(null);
    setMajorConfirmed(false);
    setOnboardingCollapsed(false);
    setInProgressSelectionCollapsed(true);
    setShowResumeBanner(false);
  };

  const toggleLevel = (lvl) =>
    setLevelFilters((prev) => {
      const n = new Set(prev);
      n.has(lvl) ? n.delete(lvl) : n.add(lvl);
      return n;
    });
    
  const toggleDifficulty = (d) =>
    setDifficultyFilters((prev) => {
      const n = new Set(prev);
      n.has(d) ? n.delete(d) : n.add(d);
      return n;
    });
    
  const toggleCredits = (c) =>
    setCreditsFilters((prev) => {
      const n = new Set(prev);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });
    
  const clearAll = () => {
    setSearch("");
    setLevelFilters(new Set());
    setDifficultyFilters(new Set());
    setCreditsFilters(new Set());
  };

  const filtered = useMemo(() => {
    if (!allCourses.length) return [];

    return allCourses.filter((c) => {
      // Normalize search by removing all spaces and converting to lowercase for more flexible matching
      const normalizedSearch = debouncedSearch.trim().toLowerCase().replace(/\s+/g, '');

      const searchHit = normalizedSearch === '' || [c.code, c.title, c.description].some((s) => {
        // Remove all spaces from the field value for comparison
        const normalizedField = s.toLowerCase().replace(/\s+/g, '');
        return normalizedField.includes(normalizedSearch);
      });

      const levelHit = levelFilters.size ? levelFilters.has(c.level) : true;
      const diffHit = difficultyFilters.size
        ? difficultyFilters.has(c.difficulty)
        : true;
      const creditsHit = creditsFilters.size
        ? creditsFilters.has(c.credits) ||
          (c.creditsUndergrad && creditsFilters.has(c.creditsUndergrad)) ||
          (c.creditsGrad && creditsFilters.has(c.creditsGrad))
        : true;
      return searchHit && levelHit && diffHit && creditsHit;
    });
  }, [debouncedSearch, levelFilters, difficultyFilters, creditsFilters, allCourses]);

  // Filter eligible courses based on completed prerequisites
  const eligibleCourses = useMemo(() => {
    if (completedCourses === null || inProgressCourses === null) return filtered;

    // If user skipped planning, show all courses without prerequisite filtering
    if (skippedPlanning) {
      console.log("🔍 Skipped planning - showing all courses without prerequisite filtering");
      return filtered;
    }

    // Convert Sets to Arrays for easier comparison
    const completedCodesArray = Array.from(completedCourses);
    const inProgressCodesArray = Array.from(inProgressCourses);

    // Get list of course codes already in the plan
    const selectedCodesArray = selected.map(c => c.code);

    console.log("🔍 Filtering eligible courses...");
    console.log("🔍 Completed courses:", completedCodesArray);
    console.log("🔍 In-progress courses:", inProgressCodesArray);
    console.log("🔍 Courses in plan:", selectedCodesArray);
    console.log("🔍 Total filtered courses:", filtered.length);

    const eligible = filtered.filter((course) => {
      // Skip courses that are already completed or in progress
      if (completedCodesArray.includes(course.code) || inProgressCodesArray.includes(course.code)) {
        console.log(`⏭Skipping ${course.code} - already completed or in progress`);
        return false;
      }

      // Skip courses that are already in the plan
      if (selectedCodesArray.includes(course.code)) {
        console.log(`Skipping ${course.code} - already in plan`);
        return false;
      }

      // Check prerequisites using grouped logic
      // prerequisiteGroups is an array of arrays: [[A, B], [C], [D, E]]
      // Groups are AND'd together, items within a group are OR'd
      if (!course.prerequisiteGroups || course.prerequisiteGroups.length === 0) {
        console.log(`${course.code} - no prerequisites needed`);
        return true;
      }

      let prereqsMet = true;
      const missingGroups = [];

      for (const group of course.prerequisiteGroups) {
        // For each group, at least ONE course must be completed OR in progress (OR within group)
        const groupMet = group.some((prereq) =>
          completedCodesArray.includes(prereq) || inProgressCodesArray.includes(prereq)
        );
        if (!groupMet) {
          prereqsMet = false;
          missingGroups.push(group);
        }
      }

      if (prereqsMet) {
        console.log(`✅ ${course.code} - prerequisites met:`, course.prerequisitesFormatted);
      } else {
        console.log(`❌ ${course.code} - missing prerequisites:`, course.prerequisitesFormatted);
      }

      return prereqsMet;
    });

    console.log("🔍 Eligible courses count:", eligible.length);
    return eligible;
  }, [filtered, completedCourses, inProgressCourses, selected, skippedPlanning]);

  const addToPlan = (course) =>
    setSelected((prev) =>
      prev.find((x) => x.id === course.id) ? prev : [...prev, course]
    );
    
  const removeFromPlan = (id) =>
    setSelected((prev) => prev.filter((c) => c.id !== id));

  const openDetail = (c) => {
    setActiveCourse(c);
    setDetailOpen(true);
  };
  
  const openGrades = (c) => {
    setActiveCourse(c);
    setGradesOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        onChangeMajor={majorConfirmed ? handleChangeMajor : null}
        selectedMajor={selectedMajor}
        user={user}
        onAuthOpen={(mode) => { setAuthMode(mode); setAuthOpen(true); }}
      />
      
      {loading ? (
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </main>
      ) : allCourses.length === 0 ? (
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="text-center py-12 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-800 font-semibold">Failed to load courses</p>
            <p className="mt-2 text-red-600 text-sm">Unable to connect to the API</p>
            <button
              onClick={fetchCourses}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </main>
      ) : !majorConfirmed ? (
        <main className="mx-auto max-w-3xl px-4 py-6 md:py-10 space-y-6">
          {/* Resume Banner */}
          {showResumeBanner && savedUserState && (
            <ResumeBanner 
              onResume={handleResumeSession}
              onStartFresh={handleStartFresh}
              savedState={savedUserState}
            />
          )}
          
          {/* 1) Skip Planning */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Skip Planning</h2>
            <p className="text-sm text-gray-600 mb-4">Jump straight into browsing all courses. You can always come back to import your audit or pick a major later.</p>
            <button
              onClick={handleSkipPlanning}
              className="relative px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-black text-sm font-medium transition-colors overflow-hidden"
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
              <span className="relative z-10">Skip and Explore Courses</span>
            </button>
          </div>

          {/* 2) Upload PDF */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Upload Degree Audit (PDF)</h2>
            <p className="text-sm text-gray-600 mb-4">We’ll auto-detect completed and in-progress courses. If you select a major after, you’ll also see remaining requirements.</p>
            <UploadAudit
              onApply={(completedSet, inProgressSet) => {
                setCompletedCourses(completedSet);
                setInProgressCourses(inProgressSet);
                setMajorConfirmed(true);
                setOnboardingCollapsed(true);
                setInProgressSelectionCollapsed(true);
                setSkippedPlanning(false);
              }}
            />
          </div>

          {/* 3) Choose a Major */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Choose Your Major</h2>
            <p className="text-sm text-gray-600 mb-4">Pick a major to see required courses, electives, and track progress.</p>
            <MajorSelection onSelectMajor={handleMajorSelect} selectedMajor={selectedMajor} />
          </div>
        </main>
      ) : (
        <div className="flex h-[calc(100vh-80px)]">
          {/* Requirements Checklist - Fixed Left Panel - Only show if user didn't skip planning */}
          {completedCourses !== null && inProgressCourses !== null && !skippedPlanning && (
            <RequiredCoursesChecklist
              requiredCourses={requiredCourses}
              electiveCourses={electiveCourses}
              completedCourses={completedCourses}
              inProgressCourses={inProgressCourses} // Pass in-progress courses
              selectedCourses={selected}
              onCourseClick={openDetail}
              isEditingCompleted={!onboardingCollapsed || !inProgressSelectionCollapsed} // Adjust edit mode logic
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
            />
          )}

          {/* Main Content */}
          <motion.main
            className="flex-1 overflow-y-auto px-4 py-6 md:py-8 space-y-6"
            layout="position"
            transition={{
              layout: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }
            }}
          >
            <div className="mx-auto max-w-6xl">
              {/* Only show onboarding sections if user didn't skip planning */}
              {!skippedPlanning && (
                <>
                  {/* Audit upload FIRST when starting planning */}
                  {!completedCourses && !onboardingCollapsed && (
                    <div className="mb-6">
                      <UploadAudit
                        majorId={selectedMajor?.id}
                        onApply={(completedSet, inProgressSet) => {
                          setCompletedCourses(completedSet);
                          setInProgressCourses(inProgressSet);
                          setOnboardingCollapsed(true);
                          setInProgressSelectionCollapsed(true);
                          setSkippedPlanning(false);
                        }}
                      />
                    </div>
                  )}
                  <OnboardingSection
                    courses={allCourses}
                    onComplete={handleOnboardingComplete}
                    completedCourses={completedCourses}
                    isCollapsed={onboardingCollapsed}
                    setIsCollapsed={setOnboardingCollapsed}
                  />

                  {/* New In-Progress Selection Section */}
                  {onboardingCollapsed && completedCourses !== null && (
                    <div className="mt-6">
                    <OnboardingSection // Reusing OnboardingSection for in-progress selection
                      courses={allCourses} // All courses for in-progress selection
                      onComplete={handleInProgressComplete}
                      completedCourses={inProgressCourses} // Use inProgressCourses for this section
                      isCollapsed={inProgressSelectionCollapsed}
                      setIsCollapsed={setInProgressSelectionCollapsed}
                      title="In Progress Courses"
                      description="Choose all courses you are currently taking."
                      buttonText="Confirm"
                      excludeCourses={completedCourses} // Exclude already completed courses
                      showCompletedFirst={true} // Show completed courses at the top
                      enforcePrerequisites={false} // Show all courses, let user search
                      completedCoursesSet={completedCourses} // Pass completed courses for prerequisite checking
                    />
                    </div>
                  )}
                </>
              )}

              <AnimatePresence>
                {completedCourses !== null && inProgressCourses !== null && onboardingCollapsed && inProgressSelectionCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-6"
                  >
                    <div>
                      <FilterBar
                        search={search}
                        setSearch={setSearch}
                        levelFilters={levelFilters}
                        toggleLevel={toggleLevel}
                        difficultyFilters={difficultyFilters}
                        toggleDifficulty={toggleDifficulty}
                        creditsFilters={creditsFilters}
                        toggleCredits={toggleCredits}
                        clearAll={clearAll}
                      />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-6">
                        <EligibleCourses
                          courses={eligibleCourses}
                          allCourses={filtered}
                          requiredCourses={requiredCourses}
                          electiveCourses={electiveCourses}
                          onAdd={addToPlan}
                          onOpenDetail={openDetail}
                          onOpenGrades={openGrades}
                          skippedPlanning={skippedPlanning}
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border shadow-sm p-4 sticky top-0">
                          <PlanSummary selected={selected} onRemove={removeFromPlan} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.main>
        </div>
      )}

      <CourseDetailModal
        course={activeCourse}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
      <GradeDistributionModal
        course={activeCourse}
        open={gradesOpen}
        onClose={() => setGradesOpen(false)}
      />
      <AuthModal isOpen={authOpen} mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onSuccess={(u)=>{setUser(u);}} />
      
      <DiagnosticPanel 
        completedCourses={completedCourses}
        allCourses={allCourses}
        eligibleCourses={eligibleCourses}
        selectedCourses={selected}
      />
    </div>
  );
}
