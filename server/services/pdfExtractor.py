#!/usr/bin/env python3
"""
pdfExtractor.py — Intelligent PDF resume extractor using PyMuPDF
Called by Node.js: python3 pdfExtractor.py <pdf_path>
Returns JSON with: text, links (with real URLs), linkedin_url, github_url, project_links

WHY PYMUPDF OVER pdf-parse:
  1. Bullets stay on the same line as text (pdf-parse splits them to separate lines)
  2. Extracts ALL hyperlinks with real URLs (pdf-parse loses hyperlinks)
  3. Returns layout blocks with Y-positions for smart section detection
  4. Handles multi-column layouts correctly
  5. 3-5x faster than pdf-parse for large files
"""

import sys
import json
import re

try:
    import fitz  # PyMuPDF
except ImportError:
    # Fallback: return error so Node.js can use pdf-parse
    print(json.dumps({'error': 'pymupdf_not_installed', 'text': ''}))
    sys.exit(0)

def extract(pdf_path):
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(json.dumps({'error': str(e), 'text': ''}))
        sys.exit(1)

    all_text_parts = []
    all_links = []
    linkedin_url = ''
    github_url   = ''
    project_links = []  # [{y, githubUrl, liveUrl}]

    for page_num, page in enumerate(doc):
        # ── Extract hyperlinks with real URLs ───────────────────────────
        page_links = []
        words = page.get_text('words')  # [(x0,y0,x1,y1,word,block,line,word_idx)]
        
        for lk in page.get_links():
            uri  = lk.get('uri', '').strip()
            rect = lk.get('from')
            if not uri or not rect:
                continue

            # Get visible text for this link from word positions
            r = fitz.Rect(rect)
            link_words = [w[4] for w in words if fitz.Rect(w[:4]).intersects(r)]
            link_text  = ' '.join(link_words).strip()
            y_pos      = round(rect[1])

            link_obj = {'uri': uri, 'text': link_text, 'y': y_pos, 'page': page_num}
            page_links.append(link_obj)
            all_links.append(link_obj)

            # Classify link type
            if 'linkedin.com' in uri and not linkedin_url:
                linkedin_url = uri
            elif 'github.com' in uri:
                # Profile-level GitHub (high in doc, y < 100)
                if y_pos < 100 and not github_url:
                    github_url = uri
                else:
                    # Project-level GitHub
                    project_links.append({'y': y_pos, 'githubUrl': uri, 'liveUrl': ''})
            elif any(d in uri for d in ['render.com', 'vercel.app', 'netlify.app',
                                         'herokuapp.com', 'onrender.com', 'railway.app',
                                         'github.io', 'glitch.me', 'fly.dev']):
                # Live demo URL — find nearest project github entry or create new
                matched = False
                for pl in project_links:
                    if abs(pl['y'] - y_pos) < 30 and not pl['liveUrl']:
                        pl['liveUrl'] = uri
                        matched = True
                        break
                if not matched:
                    project_links.append({'y': y_pos, 'githubUrl': '', 'liveUrl': uri})

        # ── Extract text (clean, bullets intact) ────────────────────────
        # Use pymupdf's text extraction — bullets stay on same line
        text = page.get_text('text')
        
        # Clean up font artifact characters that pymupdf can't decode
        # but preserve structure
        text = re.sub(r'[ÓR°\x87]\s*', '', text)  # remove icon chars before contact info
        text = text.replace('\x87', '')
        
        all_text_parts.append(text)

    full_text = '\n'.join(all_text_parts)

    # ── Post-process: merge continuation lines ───────────────────────────
    # Some PDFs wrap long bullet lines. Merge lines that are clearly continuations
    # (no bullet prefix, not a section header, continuation of previous sentence)
    lines = full_text.split('\n')
    merged = []
    BULLET_RE  = re.compile(r'^[•\-\*▸►→]\s')
    SECTION_RE = re.compile(
        r'^(education|technical\s+skills|experience|projects?|achievements?'
        r'|certifications?|languages?|interests?|summary|profile|objective'
        r'|programming|ai/ml|frameworks?|database)', re.I)
    UPPER_RE   = re.compile(r'^[A-Z][A-Z\s&/]{3,}$')  # ALL CAPS section headers

    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()

        # Check if next line is a continuation (no bullet, no header, starts lowercase or mid-sentence)
        if (stripped and
            not BULLET_RE.match(stripped) and
            not SECTION_RE.match(stripped) and
            not UPPER_RE.match(stripped) and
            i + 1 < len(lines)):

            next_line = lines[i+1].strip()
            # Continuation if: next starts lowercase OR previous ends without punctuation
            # AND next line isn't a header/bullet
            is_continuation = (
                next_line and
                not BULLET_RE.match(next_line) and
                not SECTION_RE.match(next_line) and
                not UPPER_RE.match(next_line) and
                not next_line[0].isupper() and  # starts lowercase = continuation
                len(next_line) > 0
            )

            if is_continuation:
                merged.append(line.rstrip() + ' ' + next_line)
                i += 2
                continue

        merged.append(line)
        i += 1

    processed_text = '\n'.join(merged)

    # ── Build result ─────────────────────────────────────────────────────
    result = {
        'text':          processed_text,
        'rawText':       full_text,
        'links':         all_links,
        'linkedinUrl':   linkedin_url,
        'githubUrl':     github_url,
        'projectLinks':  project_links,
        'wordCount':     len(processed_text.split()),
        'pageCount':     len(doc),
        'error':         None,
    }

    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'no_path', 'text': ''}))
        sys.exit(1)
    extract(sys.argv[1])