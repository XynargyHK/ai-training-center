#!/usr/bin/env python3
"""Delete specific sections from knowledge-base.tsx"""

# Read the file
with open('src/components/admin/knowledge-base.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and mark sections to delete
sections = [
    ('SECTION 2: PROBLEM', 'SECTION 3: SOLUTION'),
    ('SECTION 3: SOLUTION', 'SECTION 4: PROOF'),
    ('SECTION 4: PROOF', 'SECTION 5: CTA'),
    ('SECTION 5: CTA', 'Theme Colors'),
    ('Theme Colors & Footer', 'Policies Section'),
]

lines_to_keep = []
skip_mode = False
skip_depth = 0

i = 0
while i < len(lines):
    line = lines[i]

    # Check if we should start skipping
    if 'SECTION 2: PROBLEM' in line or 'SECTION 3: SOLUTION' in line or \
       'SECTION 4: PROOF' in line or 'SECTION 5: CTA' in line or \
       'Theme Colors & Footer' in line:
        # Skip from this comment until we find the closing div
        skip_mode = True
        skip_depth = 0
        i += 1
        continue

    if skip_mode:
        # Count div depth
        if '<div' in line:
            skip_depth += line.count('<div')
        if '</div>' in line:
            skip_depth -= line.count('</div>')
            # If we close all divs and hit the separator, we're done
            if skip_depth <= -1 and '═══' in line:
                skip_mode = False
                i += 1
                continue
        i += 1
        continue

    lines_to_keep.append(line)
    i += 1

# Write back
with open('src/components/admin/knowledge-base.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines_to_keep)

print(f"✅ Deleted sections. Kept {len(lines_to_keep)} / {len(lines)} lines")
