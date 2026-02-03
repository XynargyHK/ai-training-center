#!/usr/bin/env python3
"""Remove specific sections from knowledge-base.tsx"""

import re

# Read the file
with open('src/components/admin/knowledge-base.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define sections to remove (start marker -> end marker)
sections_to_remove = [
    # Section 2: Problem/Story
    (
        r'    \{/\* ═+\s+\*/\}\s+\{/\* SECTION 2: PROBLEM.*?\*/\}\s+\{/\* ═+\s+\*/\}',
        r'    \{/\* ═+\s+\*/\}\s+\{/\* SECTION 3: SOLUTION'
    ),
    # Section 3: Solution
    (
        r'    \{/\* ═+\s+\*/\}\s+\{/\* SECTION 3: SOLUTION.*?\*/\}\s+\{/\* ═+\s+\*/\}',
        r'    \{/\* ═+\s+\*/\}\s+\{/\* SECTION 4: PROOF'
    ),
    # Section 4: Proof/Trust
    (
        r'    \{/\* ═+\s+\*/\}\s+\{/\* SECTION 4: PROOF.*?\*/\}\s+\{/\* ═+\s+\*/\}',
        r'    \{/\* ═+\s+\*/\}\s+\{/\* SECTION 5: CTA'
    ),
    # Section 5: CTA/Offer
    (
        r'    \{/\* ═+\s+\*/\}\s+\{/\* SECTION 5: CTA.*?\*/\}\s+\{/\* ═+\s+\*/\}',
        r'    \{/\* Theme Colors'
    ),
    # Theme Colors & Footer
    (
        r'    \{/\* Theme Colors & Footer \*/\}',
        r'    \{/\* Policies Section'
    ),
]

# For each section, find and remove
for start_pattern, end_pattern in sections_to_remove:
    # Build pattern to match from start to just before end
    pattern = f'{start_pattern}.*?(?={end_pattern})'
    content = re.sub(pattern, '', content, flags=re.DOTALL)
    print(f"Removed section starting with: {start_pattern[:50]}...")

# Write back
with open('src/components/admin/knowledge-base.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ Removed all sections successfully!")
