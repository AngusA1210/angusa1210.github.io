#!/usr/bin/env python3
"""Make the web copy of the resume: same document, minus the home address.

    python3 tools/redact-resume.py "~/Downloads/Andrew Angus Resume.pdf" \
        assets/docs/Andrew-Angus-Resume.pdf

Why this is not just a black box drawn over the text:

  * The address glyphs are removed from the page's content stream, so there is
    nothing underneath to select, copy, or extract.
  * A Canva-style tagged PDF keeps a SECOND readable copy of the same text in
    the structure tree (/E expansion text, plus /Alt and /ActualText), for
    screen readers. That copy is scrubbed as well. Deleting only the glyphs
    leaves the address fully extractable.
  * The location-pin icon is removed too, since it would otherwise sit in the
    contact column pointing at nothing.

Phone number and email are deliberately kept.

Requires pikepdf (`pip install pikepdf`). Verify the result before publishing:

    python3 -c "from pypdf import PdfReader; \
        print(PdfReader('assets/docs/Andrew-Angus-Resume.pdf').pages[0].extract_text())"
"""

import json
import os
import re
import sys

import pikepdf

# The text to remove is deliberately NOT in this file — this repo is public,
# and listing the fragments here would hand over the address the script exists
# to take out. They live in tools/redact-marks.json, which is gitignored:
#
#   {"start": "123", "end": "90210", "needles": ["123", "90210", "Main St"]}
#
# "start" and "end" bracket the run to delete; "needles" are the fragments to
# hunt for in the tagged-PDF structure tree.
MARKS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "redact-marks.json")


def load_marks():
    if not os.path.exists(MARKS_FILE):
        sys.exit("missing %s — see the comment at the top of this file" % MARKS_FILE)
    with open(MARKS_FILE) as f:
        marks = json.load(f)
    return marks["start"], marks["end"], tuple(marks["needles"])


def tounicode_map(font):
    """code -> unicode, parsed from a font's /ToUnicode CMap."""
    out = {}
    tu = font.get("/ToUnicode")
    if tu is None:
        return out
    data = bytes(tu.read_bytes()).decode("latin-1", "replace")

    for block in re.findall(r"beginbfchar(.*?)endbfchar", data, re.S):
        for src, dst in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", block):
            out[int(src, 16)] = bytes.fromhex(dst).decode("utf-16-be", "replace")

    for block in re.findall(r"beginbfrange(.*?)endbfrange", data, re.S):
        for lo, hi, dst in re.findall(
                r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", block):
            base = int(dst, 16)
            lo_i, hi_i = int(lo, 16), int(hi, 16)
            for k in range(lo_i, hi_i + 1):
                out[k] = chr(base + (k - lo_i))
    return out


def decode(s, cmap):
    """Decode a PDF string of two-byte CIDs through a ToUnicode map."""
    raw = bytes(s)
    return "".join(cmap.get((raw[i] << 8) | raw[i + 1], "")
                   for i in range(0, len(raw) - 1, 2))


def main(src, dst):
    start_mark, end_mark, needles = load_marks()
    pdf = pikepdf.open(src)
    page = pdf.pages[0]
    maps = {str(k): tounicode_map(v) for k, v in page["/Resources"]["/Font"].items()}
    ops = pikepdf.parse_content_stream(page)

    # Decode every text-showing operator, tracking the font set by Tf.
    current, items = None, []
    for i, (operands, op) in enumerate(ops):
        name = str(op)
        if name == "Tf" and operands:
            current = str(operands[0])
        elif name in ("Tj", "TJ", "'", '"'):
            parts = []
            for x in operands:
                if isinstance(x, pikepdf.String):
                    parts.append(decode(x, maps.get(current, {})))
                elif isinstance(x, pikepdf.Array):
                    parts += [decode(e, maps.get(current, {}))
                              for e in x if isinstance(e, pikepdf.String)]
            items.append((i, "".join(parts)))

    flat = "".join(t for _, t in items)
    start, end = flat.find(start_mark), flat.find(end_mark)
    if start < 0 or end < 0:
        sys.exit("address run not found — check tools/redact-marks.json")
    end += len(end_mark)
    print("address run: %d characters" % (end - start))

    # Map that character span back to operator indices.
    doomed, pos = set(), 0
    for idx, text in items:
        if pos < end and pos + len(text) > start:
            doomed.add(idx)
        pos += len(text)

    # The "th" of "94th" is a separate superscript run just after the address.
    tail = [(i, t) for i, t in items if i > max(doomed)][:2]
    if "".join(t for _, t in tail) == "th":
        doomed.update(i for i, _ in tail)

    # The contact icons are clipped vector groups; the pin is the lowest one.
    def enclosing_group(idx):
        depth, begin = 0, None
        for i in range(idx, -1, -1):
            name = str(ops[i][1])
            if name == "Q":
                depth += 1
            elif name == "q":
                if depth == 0:
                    begin = i
                    break
                depth -= 1
        if begin is None:
            return None
        depth = 0
        for j in range(begin + 1, len(ops)):
            name = str(ops[j][1])
            if name == "q":
                depth += 1
            elif name == "Q":
                if depth == 0:
                    return begin, j
                depth -= 1
        return None

    icons = []
    for i, (operands, op) in enumerate(ops):
        if str(op) == "re" and len(operands) == 4:
            x, y, w, h = (float(v) for v in operands)
            if x < 200 and 20 < w < 80 and 20 < h < 90:
                icons.append((y, i, w, h))
    if icons:
        y, i, w, h = max(icons)
        span = enclosing_group(i)
        if span and h > w:              # a map pin is taller than it is wide
            doomed.update(range(span[0], span[1] + 1))
            print("pin icon: ops %d..%d" % span)

    print("operators removed: %d" % len(doomed))
    kept = [inst for i, inst in enumerate(ops) if i not in doomed]
    page.Contents = pdf.make_stream(pikepdf.unparse_content_stream(kept))

    # Second copy: the tagged-PDF structure tree.
    scrubbed = 0
    for obj in pdf.objects:
        if not isinstance(obj, pikepdf.Dictionary):
            continue
        for key in ("/E", "/Alt", "/ActualText", "/T", "/TU", "/Contents"):
            if key in obj:
                try:
                    value = str(obj[key])
                except Exception:
                    continue
                if any(n in value for n in needles):
                    del obj[key]
                    scrubbed += 1
    print("structure-tree entries scrubbed: %d" % scrubbed)

    pdf.save(dst)
    print("wrote %s" % dst)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(os.path.expanduser(sys.argv[1]), os.path.expanduser(sys.argv[2]))
