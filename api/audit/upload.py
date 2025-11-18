from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add parent directory to path to import audit_parser
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from audit_parser import parse_pdf, summarize
    from _db import get_db_connection
    IMPORTS_OK = True
except Exception as import_error:
    IMPORTS_OK = False
    IMPORT_ERROR = str(import_error)

def parse_multipart(data, boundary):
    """Simple multipart form data parser"""
    try:
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
    except Exception as e:
        raise Exception(f"Multipart parsing failed: {str(e)}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Check if imports worked
            if not IMPORTS_OK:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Import error: {IMPORT_ERROR}'}).encode())
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')
            
            # Check content length limit (10MB for Vercel)
            MAX_SIZE = 10 * 1024 * 1024  # 10MB
            if content_length > MAX_SIZE:
                self.send_response(413)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'File too large (max 10MB)'}).encode())
                return
            
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
                self.wfile.write(json.dumps({'error': 'No boundary found in Content-Type'}).encode())
                return
            
            # Read the body
            try:
                body = self.rfile.read(content_length)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Failed to read request body: {str(e)}'}).encode())
                return
            
            # Parse multipart data
            try:
                form_data = parse_multipart(body, boundary)
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Failed to parse form data: {str(e)}'}).encode())
                return
            
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
                error_detail = str(e)
                # Provide more specific error messages
                if 'pdf parsing library not available' in error_detail.lower():
                    error_detail = 'PDF parsing library not available on server. Please ensure requirements.txt includes pdfplumber and pdfminer.six.'
                self.wfile.write(json.dumps({'error': f'Failed to parse PDF: {error_detail}'}).encode())
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
            self.wfile.write(json.dumps({'error': error_msg}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
