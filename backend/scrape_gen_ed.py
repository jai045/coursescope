#!/usr/bin/env python3
"""Scrape General Education departments and merge into existing course database.

This script uses the existing generic_course_scraper helpers but builds
department URLs dynamically from the provided Gen Ed department list.
It will skip departments whose catalog page returns non-200 or has no courses.
"""

import os
import sys
import requests
from generic_course_scraper import scrape_department_courses, insert_courses, create_database

GEN_ED_DEPARTMENTS = [
    'AH','ANTH','ARAB','ARCH','ART','BIOS','BLST','CEES','CHE','CHEM','CHIN','CL','CLJ','COMM','CS','CST','DHD','DLG','EAES','ECON',
    'ED','EDPS','ENGL','ENTR','EPSY','FIN','FR','GEOG','GER','GKM','GLAS','GWS','HIST','HN','HON','HUM','IDEA','IE','INST','ITAL',
    'JST','KN','KOR','LALS','LCSL','LING','LITH','MATH','MCS','MILS','MOVI','MUS','NAST','NATS','NUEL','PHAR','PHIL','PHYS','POL','POLS',
    'PPOL','PSCH','PUBH','RELS','RUSS','SJ','SOC','SPAN','SPED','THTR','US'
]

def url_for(dept: str) -> str:
    return f"https://catalog.uic.edu/ucat/course-descriptions/{dept.lower()}/"

def main():
    print("="*60)
    print("Gen Ed Department Scraper")
    print("="*60)

    # Ensure we run inside backend directory so DB path is predictable
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    conn = create_database()  # connects/creates uic_courses.db locally
    print("✓ Connected database: uic_courses.db")

    added = 0
    updated = 0
    processed = 0
    skipped = []
    failed = []

    for dept in GEN_ED_DEPARTMENTS:
        processed += 1
        url = url_for(dept)
        print(f"\n{'-'*60}\n[{processed}/{len(GEN_ED_DEPARTMENTS)}] {dept} -> {url}")
        try:
            # Quick HEAD/GET check to avoid long 404 HTML parsing
            resp = requests.get(url, timeout=15)
            if resp.status_code != 200:
                print(f"✗ Skipping {dept}: HTTP {resp.status_code}")
                failed.append(dept)
                continue

            courses = scrape_department_courses(dept, url)
            if not courses:
                print(f"⚠️  No courses found for {dept}")
                skipped.append(dept)
                continue

            # Count existing before insert to derive deltas
            cur = conn.cursor()
            cur.execute('SELECT COUNT(*) FROM courses WHERE course_code LIKE ?', (f'{dept}%',))
            before = cur.fetchone()[0]

            insert_courses(conn, courses)

            cur.execute('SELECT COUNT(*) FROM courses WHERE course_code LIKE ?', (f'{dept}%',))
            after = cur.fetchone()[0]
            delta = after - before
            if delta > 0:
                added += delta
            else:
                updated += len(courses)
            print(f"✓ {dept}: {after} total (Δ {delta})")
        except Exception as e:
            print(f"❌ Error processing {dept}: {e}")
            failed.append(dept)

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Departments requested: {len(GEN_ED_DEPARTMENTS)}")
    print(f"Courses added (new rows): {added}")
    print(f"Departments with no courses: {len(skipped)} -> {' '.join(skipped) if skipped else 'None'}")
    print(f"Failed requests: {len(failed)} -> {' '.join(failed) if failed else 'None'}")

    conn.close()
    print("✓ Closed DB")
    print("Next: copy backend/uic_courses.db to api/uic_courses.db to expose via Vercel.")

if __name__ == '__main__':
    main()
