#!/usr/bin/env python3
"""
Quick test of audit_parser without HTTP overhead.
Usage: python test_parser.py path/to/audit.pdf
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from audit_parser import parse_pdf

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_parser.py <path-to-audit.pdf>")
        print("\nOr place 'test.pdf' in the current directory.")
        test_file = "test.pdf"
    else:
        test_file = sys.argv[1]
    
    if not os.path.exists(test_file):
        print(f"Error: File '{test_file}' not found")
        sys.exit(1)
    
    print(f"Parsing {test_file}...")
    try:
        with open(test_file, 'rb') as f:
            result = parse_pdf(f.read())
        
        print("\n" + "="*60)
        print("PARSED RESULTS")
        print("="*60)
        
        completed, in_progress = result
        
        print(f"\nCompleted Courses ({len(completed)}):")
        for course in sorted(completed):
            print(f"  - {course}")
        
        print(f"\nIn Progress Courses ({len(in_progress)}):")
        for course in sorted(in_progress):
            print(f"  - {course}")
        
        print(f"\nTotal: {len(completed)} completed, {len(in_progress)} in progress")
        
        print("\n" + "="*60)
        print(f"Total courses detected: {len(completed) + len(in_progress)}")
        print("="*60)
        
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
