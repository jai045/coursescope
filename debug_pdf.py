#!/usr/bin/env python3
import sys
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams
from io import StringIO

if len(sys.argv) < 2:
    print("Usage: python debug_pdf.py <pdf-file>")
    sys.exit(1)

pdf_path = sys.argv[1]

with open(pdf_path, 'rb') as f:
    output = StringIO()
    extract_text_to_fp(f, output, laparams=LAParams())
    text = output.getvalue()
    
print("="*60)
print("EXTRACTED TEXT (first 2000 chars):")
print("="*60)
print(text[:2000])
print("="*60)
print(f"\nTotal text length: {len(text)} characters")
