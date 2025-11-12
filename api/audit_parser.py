import io
import re
from typing import Dict, List, Set, Tuple

try:
    import pdfplumber  # type: ignore
except ImportError:  # Soft fallback; endpoint will raise instructive error if missing
    pdfplumber = None

COURSE_CODE_PATTERN = re.compile(r"\b([A-Z]{2,4})\s?(\d{2,3})([A-Z]{1,2})?\b")
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

def _normalize_course(dept: str, num: str, suffix: str | None) -> str:
    code = f"{dept} {num}".strip()
    if suffix:
        # Some audits append letters (e.g., 101H) – treat as part of number
        code = f"{dept} {num}{suffix}".strip()
    return code.upper()

def extract_courses_from_line(line: str) -> List[str]:
    courses = []
    for match in COURSE_CODE_PATTERN.finditer(line):
        dept, num, suffix = match.groups()
        courses.append(_normalize_course(dept, num, suffix))
    return courses

def classify_line(line: str) -> str | None:
    for status, keywords in STATUS_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in line.lower():
                return status
    # If a letter grade appears we assume completed
    if GRADE_PATTERN.search(line):
        return "completed"
    return None

def parse_text(lines: List[str]) -> Dict[str, Set[str]]:
    completed: Set[str] = set()
    in_progress: Set[str] = set()
    planned: Set[str] = set()
    needed: Set[str] = set()

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if any(patt.search(line) for patt in IGNORE_PATTERNS):
            continue
        courses = extract_courses_from_line(line)
        if not courses:
            continue
        status = classify_line(line)
        target_set: Set[str] | None = None
        if status == "completed":
            target_set = completed
        elif status == "in_progress":
            target_set = in_progress
        elif status == "planned":
            target_set = planned
        elif status == "needed":
            target_set = needed
        # Default heuristic: if no status but line contains a grade -> completed (already handled); else treat as completed?
        if target_set is None:
            # Conservative: do not assume completion without explicit indicator
            continue
        for c in courses:
            target_set.add(c)

    return {
        "completed": completed,
        "in_progress": in_progress,
        "planned": planned,
        "needed": needed,
    }

def parse_pdf(file_bytes: bytes) -> Dict[str, Set[str]]:
    if pdfplumber is None:
        raise RuntimeError("pdfplumber not installed. Please install dependencies.")
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        lines: List[str] = []
        for page in pdf.pages:
            text = page.extract_text() or ""
            lines.extend(text.splitlines())
    return parse_text(lines)

def summarize(parsed: Dict[str, Set[str]], major_required: Set[str], major_electives: Set[str]) -> Dict[str, List[str]]:
    completed = parsed["completed"]
    in_progress = parsed["in_progress"]

    remaining_required = sorted([c for c in major_required if c not in completed and c not in in_progress])
    remaining_electives = sorted([c for c in major_electives if c not in completed and c not in in_progress])

    return {
        "completedCourses": sorted(completed),
        "inProgressCourses": sorted(in_progress),
        "remainingRequired": remaining_required,
        "remainingElectives": remaining_electives,
        "plannedCourses": sorted(parsed["planned"]),
        "neededCoursesRaw": sorted(parsed["needed"]),
    }

if __name__ == "__main__":
    # Simple manual test placeholder (expects test.pdf next to script)
    test_path = "test.pdf"
    if os.path.exists(test_path):  # type: ignore[name-defined]
        with open(test_path, "rb") as f:  # type: ignore[name-defined]
            result = parse_pdf(f.read())
            print(result)
    else:
        print("Place a test.pdf file in backend/ to try local parsing.")
