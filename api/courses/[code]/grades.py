from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add api directory to path to import _db
api_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, api_dir)

from _db import get_db_connection

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Extract course code from path
            # Path format: /api/courses/{code}/grades
            path_parts = self.path.split('/')
            # Find 'courses' in path and get the next element
            try:
                courses_idx = path_parts.index('courses')
                course_code = path_parts[courses_idx + 1].upper()
            except (ValueError, IndexError):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid path format'}).encode())
                return

            conn = get_db_connection()
            cursor = conn.cursor()

            # Check if course exists
            cursor.execute('''
                SELECT id, course_code, title
                FROM courses
                WHERE course_code = ?
            ''', (course_code,))

            course = cursor.fetchone()

            if course is None:
                conn.close()
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Course not found'}).encode())
                return

            # Get all grade distributions for this course
            cursor.execute('''
                SELECT semester, instructor, a_count, b_count, c_count, d_count, f_count, w_count, total_count
                FROM grade_distributions
                WHERE course_code = ?
                ORDER BY semester DESC, instructor
            ''', (course_code,))

            grades = cursor.fetchall()
            conn.close()

            result = []
            for grade in grades:
                result.append({
                    'semester': grade['semester'],
                    'instructor': grade['instructor'],
                    'grades': {
                        'A': grade['a_count'] or 0,
                        'B': grade['b_count'] or 0,
                        'C': grade['c_count'] or 0,
                        'D': grade['d_count'] or 0,
                        'F': grade['f_count'] or 0,
                        'W': grade['w_count'] or 0
                    },
                    'total': grade['total_count'] or 0
                })

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
