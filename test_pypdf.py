#!/usr/bin/env python3
"""Test pypdf extraction"""

from pypdf import PdfReader
import sys

if len(sys.argv) > 1:
    pdf_path = sys.argv[1]
else:
    pdf_path = "/Users/jaini/Downloads/My Audit - Audit Results Tab 1.pdf"

print(f"Testing pypdf extraction on: {pdf_path}\n")

with open(pdf_path, 'rb') as f:
    reader = PdfReader(f)
    print(f"Number of pages: {len(reader.pages)}\n")
    
    text = ""
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        text += page_text + "\n"
        print(f"Page {i+1} extracted {len(page_text)} characters")
    
    print(f"\nTotal text length: {len(text)} characters")
    print("\n" + "="*60)
    print("First 3000 characters:")
    print("="*60)
    print(text[:3000])
    
    print("\n" + "="*60)
    print("Checking for course patterns...")
    print("="*60)
    
    import re
    semester_pattern = re.compile(r"\b(FA|SP|SU|WS|SS)\d{2}\s+([A-Z]{2,4})\s+(\d{2,3})")
    matches = semester_pattern.findall(text)
    print(f"Found {len(matches)} semester+course patterns:")
    for match in matches[:20]:  # Show first 20
        print(f"  {match[0]}{match[1]} {match[2]}")
