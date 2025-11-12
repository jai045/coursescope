from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import cgi
from io import BytesIO

# Add parent directory to path to import audit_parser
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from audit_parser import parse_pdf, summarize
from _db import get_db_connection

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse multipart form data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_error(400, 'Expected multipart/form-data')
                return
            
            # Parse the form data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    'REQUEST_METHOD': 'POST',
                    'CONTENT_TYPE': self.headers['Content-Type'],
                }
            )
            
            # Get the file
            if 'file' not in form:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing file field'}).encode())
                return
            
            file_item = form['file']
            if not file_item.filename:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No file uploaded'}).encode())
                return
                
            if not file_item.filename.lower().endswith('.pdf'):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'File must be a PDF'}).encode())
                return
            
            # Read file bytes
            file_bytes = file_item.file.read()
            
            # Parse the PDF
            try:
                parsed = parse_pdf(file_bytes)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Failed to parse PDF: {str(e)}'}).encode())
                return
            
            # Get major_id if provided
            major_id = form.getvalue('majorId')
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
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'Server error: {str(e)}'}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
