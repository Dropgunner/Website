#!/usr/bin/env python3
"""Parse AgenticAIKnowledgeBase.md and extract structured content for the website."""

import re
import json

def parse_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into sections by top-level headings (# N. Title)
    # We'll identify major sections
    sections = []
    
    # Find all top-level sections (# digit)
    pattern = re.compile(r'^# (\d+)\. (.+)$', re.MULTILINE)
    matches = list(pattern.finditer(content))
    
    for i, match in enumerate(matches):
        section_num = match.group(1)
        section_title = match.group(2).strip()
        start = match.start()
        end = matches[i+1].start() if i+1 < len(matches) else len(content)
        section_content = content[start:end]
        
        # Extract subsections (## headings)
        sub_pattern = re.compile(r'^## (.+)$', re.MULTILINE)
        sub_matches = list(sub_pattern.finditer(section_content))
        
        subsections = []
        for j, sub in enumerate(sub_matches):
            sub_title = sub.group(1).strip()
            sub_start = sub.start()
            sub_end = sub_matches[j+1].start() if j+1 < len(sub_matches) else len(section_content)
            sub_content = section_content[sub_start:sub_end]
            
            # Clean up content: remove image markdown, keep text and links
            # Remove image lines
            sub_content_clean = re.sub(r'!\[.*?\]\(.*?\)\s*_.*?_', '', sub_content)
            sub_content_clean = re.sub(r'!\[.*?\]\(.*?\)', '', sub_content_clean)
            # Keep content but limit for JSON
            sub_content_clean = sub_content_clean.strip()
            
            # Extract links from subsection
            link_pattern = re.compile(r'\[([^\]]+)\]\((https?://[^\)]+)\)')
            links = [{"text": m.group(1), "url": m.group(2)} for m in link_pattern.finditer(sub_content_clean)]
            
            # Extract key bullet points (lines starting with -)
            bullets = re.findall(r'^- \*\*([^*]+)\*\*:?\s*(.*)$', sub_content_clean, re.MULTILINE)
            
            subsections.append({
                "id": f"s{section_num}-{j+1}",
                "title": sub_title,
                "content": sub_content_clean[:3000],  # limit size
                "links": links[:20],
                "key_points": [{"term": b[0], "desc": b[1][:200]} for b in bullets[:15]]
            })
        
        # Extract section intro (content before first ##)
        intro_end = sub_matches[0].start() if sub_matches else len(section_content)
        intro = section_content[len(match.group(0)):intro_end].strip()
        intro_clean = re.sub(r'!\[.*?\]\(.*?\)\s*_.*?_', '', intro)
        intro_clean = re.sub(r'!\[.*?\]\(.*?\)', '', intro_clean).strip()
        
        sections.append({
            "id": f"section-{section_num}",
            "num": int(section_num),
            "title": section_title,
            "intro": intro_clean[:1000],
            "subsections": subsections
        })
    
    return sections

if __name__ == "__main__":
    sections = parse_markdown('/home/ubuntu/upload/AgenticAIKnowledgeBase.md')
    print(f"Parsed {len(sections)} sections")
    for s in sections:
        print(f"  Section {s['num']}: {s['title']} ({len(s['subsections'])} subsections)")
    
    with open('/home/ubuntu/agentic-ai-kb/content.json', 'w', encoding='utf-8') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
    print("Saved to content.json")
