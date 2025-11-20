import { supabase } from './supabaseClient';

const TABLE = 'user_states';

export async function loadUserState(userId) {
  console.log('📂 Loading user state for user:', userId);
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('📂 Load error:', error);
    throw error;
  }
  console.log('📂 Loaded data:', data);
  if (data) {
    console.log('📂 Completed courses from DB:', data.completed_courses);
    console.log('📂 In-progress courses from DB:', data.in_progress_courses);
  }
  return data || null;
}

export async function saveUserState(userId, { selectedMajor, completedCourses, inProgressCourses, plannedCourses }) {
  console.log('💾 Saving user state...');
  console.log('💾 Selected Major:', selectedMajor);
  console.log('💾 Completed Courses (raw):', completedCourses);
  console.log('💾 In-Progress Courses (raw):', inProgressCourses);
  console.log('💾 Planned Courses (raw):', plannedCourses);
  
  const completedArray = Array.isArray(completedCourses) ? completedCourses : Array.from(completedCourses || []);
  const inProgressArray = Array.isArray(inProgressCourses) ? inProgressCourses : Array.from(inProgressCourses || []);
  
  console.log('💾 Completed Courses (array):', completedArray);
  console.log('💾 In-Progress Courses (array):', inProgressArray);
  
  const row = {
    id: userId,
    selected_major: selectedMajor ? { id: selectedMajor.id, name: selectedMajor.name, concentration: selectedMajor.concentration } : null,
    completed_courses: completedArray,
    in_progress_courses: inProgressArray,
    updated_at: new Date().toISOString()
  };
  
  // Only add planned_courses if it exists in the schema (try to save it, but don't fail if column doesn't exist)
  if (plannedCourses) {
    // Save course codes as strings, not full course objects
    row.planned_courses = Array.isArray(plannedCourses) 
      ? plannedCourses.map(c => typeof c === 'string' ? c : c.code)
      : plannedCourses;
  }
  
  console.log('💾 Final row to save:', row);
  
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) {
    console.error('💾 Save error:', error);
    // If error is about planned_courses column not existing, try without it
    if (error.message && error.message.includes('planned_courses')) {
      delete row.planned_courses;
      const { data: retryData, error: retryError } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (retryError) throw retryError;
      console.log('💾 Saved successfully (without planned_courses):', retryData);
      return retryData;
    }
    throw error;
  }
  console.log('💾 Saved successfully:', data);
  return data;
}
