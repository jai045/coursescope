from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import parse_qs

# Add parent directory to path to import audit_parser
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from audit_parser import parse_pdf, summarize
from _db import get_db_connection

def parse_multipart(data, boundary):
    """Simple multipart form data parser"""
    parts = data.split(boundary.encode())
    result = {}
    
    for part in parts:
        if not part or part == b'--\r\n' or part == b'--':
            continue
            
        # Find the double newline that separates headers from content
        if b'\r\n\r\n' in part:
            headers, content = part.split(b'\r\n\r\n', 1)
            # Remove trailing \r\n
            content = content.rstrip(b'\r\n')
            
            # Parse Content-Disposition header
            for line in headers.split(b'\r\n'):
                if line.startswith(b'Content-Disposition:'):
                    # Extract field name
                    if b'name="' in line:
                        name_start = line.find(b'name="') + 6
                        name_end = line.find(b'"', name_start)
                        field_name = line[name_start:name_end].decode()
                        
                        # Check if it's a file
                        if b'filename="' in line:
                            result[field_name] = {'content': content, 'is_file': True}
                        else:
                            result[field_name] = {'content': content.decode(), 'is_file': False}
    
    return result

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')
            
            if not content_type.startswith('multipart/form-data'):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Expected multipart/form-data'}).encode())
                return
            
            # Extract boundary
            boundary = None
            for part in content_type.split(';'):
                if 'boundary=' in part:
                    boundary = '--' + part.split('boundary=')[1].strip()
                    break
            
            if not boundary:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No boundary found'}).encode())
                return
            
            # Read the body
            body = self.rfile.read(content_length)
            
            # Parse multipart data
            form_data = parse_multipart(body, boundary)
            
            # Get file
            if 'file' not in form_data or not form_data['file']['is_file']:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing file field'}).encode())
                return
            
            file_bytes = form_data['file']['content']
            
            # Parse the PDF
            try:
                parsed = parse_pdf(file_bytes)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Failed to parse PDF: {str(e)}'}).encode())
                return
            
            # Get major_id if provided
            major_id = None
            if 'majorId' in form_data and not form_data['majorId']['is_file']:
                major_id = form_data['majorId']['content']
            
            remaining_summary = None
            
            if major_id:
                try:
                    mid = int(major_id)
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    
                    # Required courses
                    cursor.execute('SELECT course_code FROM major_requirements WHERE major_id = ?', (mid,))
                    required_rows = cursor.fetchall()
                    required_codes = {r['course_code'] for r in required_rows}
                    
                    # Elective courses
                    cursor.execute('SELECT course_code FROM major_electives WHERE major_id = ?', (mid,))
                    elective_rows = cursor.fetchall()
                    elective_codes = {r['course_code'] for r in elective_rows}
                    
                    conn.close()
                    remaining_summary = summarize(parsed, required_codes, elective_codes)
                except Exception as e:
                    remaining_summary = {'error': f'Failed to compute remaining requirements: {str(e)}'}
            
            # Send success response
            result = {
                'parsed': {k: sorted(list(v)) for k, v in parsed.items()},
                'summary': remaining_summary
            }
            
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
            error_msg = f'Server error: {str(e)}'
            # Include traceback in development
            import traceback
            error_msg += f'\n\nTraceback:\n{traceback.format_exc()}'
            self.wfile.write(json.dumps({'error': error_msg}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
