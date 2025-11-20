import io
import re
from typing import Dict, Set, Optional, List

# PDF library will be determined at runtime
PDF_LIBRARY = None

COURSE_CODE_PATTERN = re.compile(r"\b([A-Z]{2,4})\s+(\d{2,3})([A-Z]{1,2})?\b")

# Pattern to match semester+course patterns like "FA22 MATH 121" or "FA22MATH121" (with or without spaces)
SEMESTER_COURSE_PATTERN = re.compile(r"\b(FA|SP|SU|WS|SS)\d{2}\s*([A-Z]{2,4})\s+(\d{2,3})([A-Z]{1,2})?\b")

# Exclude semester/year codes and other non-course patterns
EXCLUDE_PATTERNS = [
    re.compile(r"^(FA|SP|SU|WS|SS)\s+\d{2}$"),  # FA 21, SP 22, SU 23, etc.
    re.compile(r"^(HN|IP)\s+\d{2,3}$"),  # HN 196, IP 62 (honor codes, etc.)
    re.compile(r"^(NO|TRANSFER)\s"),  # NO TRANSFER, etc.
]

STATUS_KEYWORDS = {
    "in_progress": ["In Progress", "IP", "In-Progress", "CURRENT"],
    "completed": ["Completed", "Satisfied", "OK", "Earned"],
    "planned": ["Planned", "PLAN", "Future"],
    "needed": ["Needed", "Not Met", "Remaining", "Still Needed"],
}
GRADE_PATTERN = re.compile(r"\b([ABCDF][+-]?)\b")

# Simple heuristic lines to ignore (headers, totals)
IGNORE_PATTERNS = [
    re.compile(r"^Page \d+ of \d+"),
    re.compile(r"^Academic Audit"),
]

def _normalize_course(dept: str, num: str, suffix: Optional[str]) -> str:
    code = f"{dept} {num}".strip()
    if suffix:
        # Some audits append letters (e.g., 101H) – treat as part of number
        code = f"{dept} {num}{suffix}".strip()
    return code.upper()

def extract_courses_from_line(line, current_status):
    """Extract course codes from a line, filter out false positives."""
    courses = []
    
    # First try to match semester+course pattern (FA22 MATH 121)
    for match in SEMESTER_COURSE_PATTERN.finditer(line):
        semester, dept, num, suffix = match.groups()
        suffix = suffix or ""
        course_code = f"{dept}{num}{suffix}"
        courses.append((course_code, current_status))
    
    # If no semester+course pattern found, try regular course codes
    if not courses:
        for match in COURSE_CODE_PATTERN.finditer(line):
            dept, num, suffix = match.groups()
            suffix = suffix or ""
            course_code = f"{dept}{num}{suffix}"
            
            # Check if this matches any exclude pattern
            should_exclude = False
            full_match = match.group(0)
            for pattern in EXCLUDE_PATTERNS:
                if pattern.match(full_match):
                    should_exclude = True
                    break
            
            if not should_exclude:
                courses.append((course_code, current_status))
    
    return courses

def classify_line(line: str) -> Optional[str]:
    for status, keywords in STATUS_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in line.lower():
                return status
    # If a letter grade appears we assume completed
    if GRADE_PATTERN.search(line):
        return "completed"
    return None

def parse_text(text):
    """Parse extracted text to find completed and in-progress courses."""
    completed = set()
    in_progress = set()
    
    # Split by lines
    lines = text.split('\n')
    current_status = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Classify the line to determine status
        line_status = classify_line(line)
        if line_status:
            current_status = line_status
        
        # Check if line contains semester+course pattern (FA22 MATH 121)
        semester_match = SEMESTER_COURSE_PATTERN.search(line)
        if semester_match:
            # Extract grade from the line (usually between credits and title)
            grade_match = re.search(r'\d+\.\d+\s+([A-Z][+-]?)\s+', line)
            
            # Determine status based on grade or position in document
            if grade_match:
                grade = grade_match.group(1)
                # If there's a grade, it's completed
                line_status = 'completed'
            elif 'IP' in line or 'IN PROGRESS' in line.upper():
                line_status = 'in_progress'
            elif current_status:
                # Use the current section status
                line_status = current_status
            else:
                # Default to completed if uncertain
                line_status = 'completed'
            
            # Extract the course code
            courses = extract_courses_from_line(line, line_status)
            for course_code, status in courses:
                if status == 'completed':
                    completed.add(course_code)
                elif status == 'in_progress':
                    in_progress.add(course_code)
    
    return completed, in_progress

def extract_text_pdfplumber(file_bytes: bytes) -> Optional[str]:
    """Try extracting text with pdfplumber (preferred). Returns text or None."""
    try:
        import pdfplumber  # type: ignore
        text_accum = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                try:
                    page_text = page.extract_text() or ""
                except Exception:
                    page_text = ""
                text_accum.append(page_text)
        return "\n".join(text_accum)
    except ImportError:
        return None
    except Exception:
        # Any runtime failure: fall through to other extractors
        return None

def extract_text_pdfminer(file_bytes: bytes) -> Optional[str]:
    """Extract text using pdfminer if available."""
    try:
        from io import StringIO
        from pdfminer.high_level import extract_text_to_fp  # type: ignore
        from pdfminer.layout import LAParams  # type: ignore
        output_string = StringIO()
        pdf_file = io.BytesIO(file_bytes)
        extract_text_to_fp(pdf_file, output_string, laparams=LAParams())
        return output_string.getvalue()
    except Exception:
        return None

def extract_text_fallback(file_bytes: bytes) -> Optional[str]:
    """Attempt any secondary fallbacks (currently none besides pdfminer)."""
    return extract_text_pdfminer(file_bytes)

def extract_text_any(file_bytes: bytes) -> str:
    """Try multiple strategies in order: pdfplumber -> pdfminer -> error."""
    # 1. pdfplumber
    text = extract_text_pdfplumber(file_bytes)
    if text and text.strip():
        return text
    # 2. pdfminer
    text = extract_text_pdfminer(file_bytes)
    if text and text.strip():
        return text
    raise RuntimeError("PDF parsing library not available or failed to extract text.")

def parse_pdf(pdf_bytes: bytes):
    """Main entry point: Extract text and parse courses."""
    text = extract_text_any(pdf_bytes)
    if not text or not text.strip():
        raise RuntimeError("No text extracted from PDF")
    completed, in_progress = parse_text(text)
    return {
        "completed": completed,
        "in_progress": in_progress,
        "planned": set(),
        "needed": set()
    }

def summarize(parsed: Dict[str, Set[str]], major_required: Set[str], major_electives: Set[str]) -> Dict[str, List[str]]:
    completed = parsed.get("completed", set())
    in_progress = parsed.get("in_progress", set())
    planned = parsed.get("planned", set())
    needed = parsed.get("needed", set())

    remaining_required = sorted([c for c in major_required if c not in completed and c not in in_progress])
    remaining_electives = sorted([c for c in major_electives if c not in completed and c not in in_progress])

    return {
        "completedCourses": sorted(list(completed)),
        "inProgressCourses": sorted(list(in_progress)),
        "remainingRequired": remaining_required,
        "remainingElectives": remaining_electives,
        "plannedCourses": sorted(list(planned)),
        "neededCoursesRaw": sorted(list(needed)),
    }
