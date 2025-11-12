from flask import request, jsonify
import sys
import os

# Add parent directory to path to import audit_parser
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from audit_parser import parse_pdf, summarize

# Import database connection from _db
from _db import get_db_connection

def handler(req):
    """Upload a degree audit PDF and auto-extract completed/in-progress courses.

    Expects multipart/form-data with fields:
      - file: PDF audit
      - majorId (optional): to compute remaining requirements
    Returns JSON with detected course sets and (if majorId provided) remaining courses.
    """
    if req.method != 'POST':
        return jsonify({'error': 'Method not allowed'}), 405
        
    if 'file' not in req.files:
        return jsonify({'error': 'Missing file field'}), 400
    
    pdf_file = req.files['file']
    if not pdf_file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'File must be a PDF'}), 400

    file_bytes = pdf_file.read()
    try:
        parsed = parse_pdf(file_bytes)
    except Exception as e:
        return jsonify({'error': f'Failed to parse PDF: {str(e)}'}), 500

    major_id = req.form.get('majorId') or req.args.get('majorId')
    remaining_summary = None
    if major_id:
        try:
            mid = int(major_id)
            conn = get_db_connection()
            cursor = conn.cursor()
            # Required
            cursor.execute('SELECT course_code FROM major_requirements WHERE major_id = ?', (mid,))
            required_rows = cursor.fetchall()
            required_codes = {r['course_code'] for r in required_rows}
            # Electives
            cursor.execute('SELECT course_code FROM major_electives WHERE major_id = ?', (mid,))
            elective_rows = cursor.fetchall()
            elective_codes = {r['course_code'] for r in elective_rows}
            conn.close()
            remaining_summary = summarize(parsed, required_codes, elective_codes)
        except Exception as e:
            remaining_summary = {'error': f'Failed to compute remaining requirements: {str(e)}'}

    return jsonify({
        'parsed': {k: sorted(list(v)) for k, v in parsed.items()},
        'summary': remaining_summary
    })
