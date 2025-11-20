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
    planned_courses: plannedCourses || [],
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
