#!/usr/bin/env python3
"""
Add courses from grade_distributions table to the main courses table
if they don't already exist.
"""

import sqlite3

def add_missing_courses_from_grades():
    """
    Find all courses in grade_distributions that aren't in the courses table
    and add them with basic information.
    """
    conn = sqlite3.connect('uic_courses.db')
    cursor = conn.cursor()

    print("="*60)
    print("Adding Missing Courses from Grade Distributions")
    print("="*60)

    # Get current count
    cursor.execute('SELECT COUNT(DISTINCT course_code) FROM courses')
    initial_count = cursor.fetchone()[0]
    print(f"\nInitial courses in database: {initial_count}")

    # Find courses in grade_distributions but not in courses
    cursor.execute('''
        SELECT DISTINCT gd.course_code
        FROM grade_distributions gd
        WHERE gd.course_code NOT IN (SELECT course_code FROM courses)
        ORDER BY gd.course_code
    ''')

    missing_courses = cursor.fetchall()
    print(f"Courses to add: {len(missing_courses)}")

    if len(missing_courses) == 0:
        print("\n✓ All courses from grade distributions already exist!")
        conn.close()
        return

    # Show first few
    print("\nSample courses to be added:")
    for row in missing_courses[:10]:
        print(f"  • {row[0]}")
    if len(missing_courses) > 10:
        print(f"  ... and {len(missing_courses) - 10} more")

    print("\nAdding courses to database...")

    added_count = 0
    for (course_code,) in missing_courses:
        # Parse course code to get subject and number
        parts = course_code.split()
        if len(parts) >= 2:
            subject = parts[0]
            number = parts[1]

            # Create a basic course title from the course code
            # We'll use placeholder data since we don't have full course info
            title = f"{subject} {number}"
            description = "Course information available through grade distributions"
            credits = "3"  # Default assumption
            credits_undergrad = 3
            credits_grad = 3

            # Determine level based on course number
            try:
                num_val = int(''.join(filter(str.isdigit, number)))
                if num_val >= 500:
                    level = 3  # Graduate
                elif num_val >= 300:
                    level = 2  # Upper-level
                else:
                    level = 1  # Lower-level
            except:
                level = 1  # Default to lower-level

            try:
                cursor.execute('''
                    INSERT INTO courses
                    (course_code, course_number, title, credits, description, level,
                     credits_undergrad, credits_grad)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (course_code, number, title, credits, description, level,
                      credits_undergrad, credits_grad))

                added_count += 1

                if added_count <= 5:
                    print(f"  ✓ Added {course_code}")

            except sqlite3.IntegrityError as e:
                print(f"  ✗ Failed to add {course_code}: {e}")
                continue

    conn.commit()

    # Get final count
    cursor.execute('SELECT COUNT(DISTINCT course_code) FROM courses')
    final_count = cursor.fetchone()[0]

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Initial courses: {initial_count}")
    print(f"Courses added: {added_count}")
    print(f"Final courses: {final_count}")

    # Show some statistics
    print("\nSample of newly added courses:")
    cursor.execute('''
        SELECT course_code, level
        FROM courses
        WHERE description = 'Course information available through grade distributions'
        ORDER BY course_code
        LIMIT 15
    ''')

    for course_code, level in cursor.fetchall():
        level_name = {1: "Lower", 2: "Upper", 3: "Grad"}.get(level, "Unknown")
        print(f"  {course_code} (Level: {level_name})")

    conn.close()
    print("\n✓ Complete!")

if __name__ == "__main__":
    add_missing_courses_from_grades()
