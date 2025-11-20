import { supabase } from './supabaseClient';

const TABLE = 'user_states';

export async function loadUserState(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function saveUserState(userId, { selectedMajor, completedCourses, inProgressCourses, plannedCourses }) {
  const row = {
    id: userId,
    selected_major: selectedMajor ? { id: selectedMajor.id, name: selectedMajor.name, concentration: selectedMajor.concentration } : null,
    completed_courses: Array.isArray(completedCourses) ? completedCourses : Array.from(completedCourses || []),
    in_progress_courses: Array.isArray(inProgressCourses) ? inProgressCourses : Array.from(inProgressCourses || []),
    updated_at: new Date().toISOString()
  };
  
  // Only add planned_courses if it exists in the schema (try to save it, but don't fail if column doesn't exist)
  if (plannedCourses) {
    // Save course codes as strings, not full course objects
    row.planned_courses = Array.isArray(plannedCourses) 
      ? plannedCourses.map(c => typeof c === 'string' ? c : c.code)
      : plannedCourses;
  }
  
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) {
    // If error is about planned_courses column not existing, try without it
    if (error.message && error.message.includes('planned_courses')) {
      delete row.planned_courses;
      const { data: retryData, error: retryError } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (retryError) throw retryError;
      return retryData;
    }
    throw error;
  }
  return data;
}
