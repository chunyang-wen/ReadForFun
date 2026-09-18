#!/usr/bin/env python3
"""Manage Tang Poetry collection data and assets.

Features:
- Add a new poem by title and poet (or interactive/arguments)
- Batch import poems from JSON or TXT file
- Generate accurate pinyin with tones using pypinyin
- Validate poems schema and line assets
- Generate Chinese classical ink-and-wash illustrations for poem lines
"""

from __future__ import annotations

import argparse
import html
import json
import math
import os
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
TANG_SHI_DIR = REPO_ROOT / "ReadForFun" / "tang-shi"
DATA_FILE = TANG_SHI_DIR / "data" / "poems.json"
IMAGES_DIR = TANG_SHI_DIR / "images"

CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")

POETRY_PINYIN_CORRECTIONS = {
    "鬓毛衰": ["bìn", "máo", "cuī"],
    "生紫烟": ["shēng", "zǐ", "yān"],
    "一行白鹭": ["yī", "háng", "bái", "lù"],
}


def pinyin_for_text(text: str) -> str:
    """Return tone-marked pinyin tokens for Han characters in text."""
    from pypinyin import Style, lazy_pinyin

    tokens: list[str] = []
    for run in re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff]+", text):
        corrected = False
        for phrase, c_tokens in POETRY_PINYIN_CORRECTIONS.items():
            if run == phrase:
                tokens.extend(c_tokens)
                corrected = True
                break
        if not corrected:
            tokens.extend(lazy_pinyin(run, style=Style.TONE, neutral_tone_with_five=True))
    return " ".join(tokens)


def slugify(text: str) -> str:
    """Convert Chinese pinyin or English text into safe filename slug."""
    from pypinyin import Style, lazy_pinyin

    pinyin_parts = lazy_pinyin(text, style=Style.NORMAL)
    slug = "-".join("".join(p for p in part if p.isalnum()) for part in pinyin_parts if part)
    slug = re.sub(r"-+", "-", slug).strip("-").lower()
    return slug or "poem"


def load_poems() -> list[dict[str, Any]]:
    if not DATA_FILE.exists():
        return []
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Error loading {DATA_FILE}: {e}")
        return []


def save_poems(poems: list[dict[str, Any]]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(poems, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    js_file = DATA_FILE.with_suffix(".js")
    js_content = "/** Tang Poetry Dataset */\nwindow.__TANG_POEMS_DATA__ = " + json.dumps(poems, ensure_ascii=False, indent=2) + ";\n"
    js_file.write_text(js_content, encoding="utf-8")
    print(f"Saved {len(poems)} poems to {DATA_FILE} and {js_file}")


def generate_ink_illustration_svg(
    title: str,
    line_text: str,
    line_index: int,
    total_lines: int,
    mood_tags: list[str],
    palette_seed: int = 0,
) -> str:
    """Generate an exquisite Chinese ink-and-wash SVG artwork for a poem line."""
    has_sun = any(k in line_text for k in ["日", "晨", "曛", "晴", "昼"])
    has_moon = any(k in line_text for k in ["月", "夜", "夕", "宵", "星"])
    has_water = any(k in line_text for k in ["水", "河", "江", "海", "川", "瀑", "湖", "溪", "渚", "波"])
    has_mountain = any(k in line_text for k in ["山", "岳", "峰", "岭", "径", "岩"])
    has_plants = any(k in line_text for k in ["草", "木", "花", "树", "柳", "竹", "松", "荷", "红豆", "枫", "芳"])
    has_farm = any(k in line_text for k in ["禾", "田", "农", "锄", "粟", "盘", "汗", "耕", "辛苦"])
    has_snow = any(k in line_text for k in ["雪", "霜", "寒", "冰", "冷"])
    has_birds = any(k in line_text for k in ["鸟", "禽", "雁", "莺", "燕", "鹭", "鹅"])
    has_architecture = any(k in line_text for k in ["楼", "城", "台", "关", "亭", "舟", "桥", "门", "家"])

    palettes = [
        # Blue-green celadon
        {
            "sky_top": "#1a2c35", "sky_mid": "#395b64", "sky_bot": "#e7ecef",
            "mountain_far": "#4a707a", "mountain_mid": "#274954", "mountain_near": "#132c33",
            "accent": "#d35d47", "sun_color": "#e07a5f", "water_color": "#2c4a52",
            "mist": "rgba(235, 240, 237, 0.45)"
        },
        # Warm Ochre & Sunset
        {
            "sky_top": "#3a2312", "sky_mid": "#8c532b", "sky_bot": "#f7e1d7",
            "mountain_far": "#795548", "mountain_mid": "#4e342e", "mountain_near": "#2d1e18",
            "accent": "#c0392b", "sun_color": "#e65100", "water_color": "#6d4c41",
            "mist": "rgba(255, 243, 224, 0.4)"
        },
        # Moonlit Indigo
        {
            "sky_top": "#0b132b", "sky_mid": "#1c2541", "sky_bot": "#3a506b",
            "mountain_far": "#283b54", "mountain_mid": "#172338", "mountain_near": "#0a1120",
            "accent": "#f4d06f", "sun_color": "#f8f9fa", "water_color": "#162842",
            "mist": "rgba(200, 220, 240, 0.25)"
        },
        # Spring Green
        {
            "sky_top": "#283618", "sky_mid": "#606c38", "sky_bot": "#fefae0",
            "mountain_far": "#516843", "mountain_mid": "#374f28", "mountain_near": "#1b2d13",
            "accent": "#d62828", "sun_color": "#dda15e", "water_color": "#3d5a45",
            "mist": "rgba(254, 250, 224, 0.5)"
        },
        # Monochromatic Snow
        {
            "sky_top": "#1e2229", "sky_mid": "#3f4652", "sky_bot": "#eaedf1",
            "mountain_far": "#6c757d", "mountain_mid": "#343a40", "mountain_near": "#1a1d20",
            "accent": "#b71c1c", "sun_color": "#f8f9fa", "water_color": "#212529",
            "mist": "rgba(240, 245, 250, 0.65)"
        },
    ]

    if has_snow:
        pal = palettes[4]
    elif has_moon:
        pal = palettes[2]
    elif has_farm or (has_sun and "午" in line_text):
        pal = palettes[1]
    elif has_plants or "春" in line_text or "雨" in line_text:
        pal = palettes[3]
    else:
        pal = palettes[(palette_seed + line_index) % len(palettes)]

    w, h = 960, 640

    m_far = f"M 0 {h*0.58} Q {w*0.25} {h*0.35} {w*0.48} {h*0.52} T {w*0.85} {h*0.38} L {w} {h*0.45} L {w} {h} L 0 {h} Z"
    m_mid = f"M 0 {h*0.68} Q {w*0.18} {h*0.48} {w*0.38} {h*0.62} Q {w*0.62} {h*0.42} {w*0.82} {h*0.65} L {w} {h*0.62} L {w} {h} L 0 {h} Z"
    m_near = f"M 0 {h*0.82} C {w*0.22} {h*0.74} {w*0.45} {h*0.86} {w*0.72} {h*0.79} C {w*0.85} {h*0.75} {w*0.95} {h*0.84} {w} {h*0.80} L {w} {h} L 0 {h} Z"

    celestial_svg = ""
    if has_moon:
        celestial_svg = f'<circle cx="{w*0.8}" cy="{h*0.22}" r="38" fill="{pal["sun_color"]}" filter="url(#glow)"/>'
    elif has_sun or not has_snow:
        celestial_svg = f'<circle cx="{w*0.22}" cy="{h*0.28}" r="46" fill="{pal["sun_color"]}" opacity="0.88" filter="url(#sunGlow)"/>'

    birds_svg = f"""
    <g opacity="0.65" stroke="{pal['mountain_far']}" stroke-width="2.2" stroke-linecap="round" fill="none">
        <path d="M {w*0.62} {h*0.20} Q {w*0.63} {h*0.19} {w*0.64} {h*0.21} Q {w*0.65} {h*0.19} {w*0.66} {h*0.20}"/>
        <path d="M {w*0.66} {h*0.17} Q {w*0.67} {h*0.16} {w*0.68} {h*0.18} Q {w*0.69} {h*0.16} {w*0.70} {h*0.17}"/>
        <path d="M {w*0.71} {h*0.22} Q {w*0.72} {h*0.21} {w*0.73} {h*0.23} Q {w*0.74} {h*0.21} {w*0.75} {h*0.22}"/>
    </g>
    """

    feature_svg = ""
    if has_farm:
        feature_svg = f"""
        <path d="M 0 {h*0.84} Q {w*0.3} {h*0.80} {w*0.6} {h*0.86} T {w} {h*0.83}" stroke="{pal['accent']}" stroke-width="3" stroke-dasharray="6,8" fill="none" opacity="0.4"/>
        <path d="M 0 {h*0.90} Q {w*0.4} {h*0.87} {w*0.75} {h*0.93} T {w} {h*0.89}" stroke="{pal['accent']}" stroke-width="2" stroke-dasharray="4,6" fill="none" opacity="0.3"/>
        <g transform="translate({w*0.35}, {h*0.72}) scale(0.65)" fill="{pal['mountain_near']}">
            <path d="M 0 -24 L 28 -34 L 56 -24 Z"/>
            <circle cx="28" cy="-18" r="7"/>
            <path d="M 24 -11 L 32 -11 L 35 20 L 22 20 Z"/>
            <line x1="12" y1="-28" x2="44" y2="28" stroke="{pal['mountain_near']}" stroke-width="3.5"/>
            <rect x="38" y="24" width="14" height="6" transform="rotate(30 38 24)"/>
            <path d="M 23 20 L 19 46 L 15 48"/>
            <path d="M 33 20 L 36 46 L 40 48"/>
        </g>
        """
    elif has_architecture or "楼" in line_text or "亭" in line_text:
        feature_svg = f"""
        <g transform="translate({w*0.72}, {h*0.50}) scale(0.85)" fill="{pal['mountain_mid']}">
            <path d="M 0 0 C 15 -12 35 -14 50 -3 C 65 -14 85 -12 100 0 L 92 6 L 8 6 Z"/>
            <path d="M -10 22 C 10 10 40 8 50 18 C 60 8 90 10 110 22 L 102 28 L -2 28 Z"/>
            <rect x="18" y="28" width="6" height="34"/>
            <rect x="76" y="28" width="6" height="34"/>
            <rect x="47" y="28" width="6" height="34"/>
            <rect x="10" y="54" width="80" height="8"/>
            <polygon points="-16,62 116,62 128,95 -28,95"/>
        </g>
        """
    elif has_water or "舟" in line_text or "渔" in line_text:
        feature_svg = f"""
        <g transform="translate({w*0.42}, {h*0.77}) scale(0.8)" fill="{pal['mountain_near']}">
            <path d="M 0 10 Q 50 30 110 10 Q 60 20 0 10 Z"/>
            <path d="M 46 8 L 56 -10 L 66 8 Z"/>
            <path d="M 42 -10 L 56 -18 L 70 -10 Z"/>
            <line x1="62" y1="-8" x2="115" y2="-22" stroke="{pal['mountain_near']}" stroke-width="2"/>
            <line x1="115" y1="-22" x2="118" y2="18" stroke="{pal['accent']}" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.6"/>
        </g>
        """
    elif has_plants or "柳" in line_text or "竹" in line_text:
        feature_svg = f"""
        <g stroke="{pal['mountain_near']}" fill="{pal['mountain_near']}">
            <path d="M 0 {h*0.25} Q {w*0.12} {h*0.28} {w*0.22} {h*0.38} T {w*0.28} {h*0.48}" stroke-width="7" fill="none" stroke-linecap="round"/>
            <path d="M {w*0.10} {h*0.27} Q {w*0.14} {h*0.36} {w*0.12} {h*0.45}" stroke-width="3.5" fill="none"/>
            <path d="M {w*0.20} {h*0.36} Q {w*0.25} {h*0.42} {w*0.26} {h*0.52}" stroke-width="2.5" fill="none"/>
            <circle cx="{w*0.28}" cy="{h*0.49}" r="9" opacity="0.85"/>
            <circle cx="{w*0.26}" cy="{h*0.53}" r="7" opacity="0.75"/>
            <circle cx="{w*0.12}" cy="{h*0.46}" r="8" opacity="0.85"/>
            <circle cx="{w*0.14}" cy="{h*0.49}" r="6" opacity="0.75"/>
        </g>
        """

    clean_line = html.escape(line_text)
    clean_title = html.escape(title)

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{pal['sky_top']}"/>
      <stop offset="55%" stop-color="{pal['sky_mid']}"/>
      <stop offset="100%" stop-color="{pal['sky_bot']}"/>
    </linearGradient>
    <linearGradient id="mountFarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{pal['mountain_far']}"/>
      <stop offset="100%" stop-color="{pal['sky_bot']}" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="mountMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{pal['mountain_mid']}"/>
      <stop offset="100%" stop-color="{pal['mountain_far']}" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="mountNearGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{pal['mountain_near']}"/>
      <stop offset="100%" stop-color="{pal['mountain_mid']}"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="{w}" height="{h}" fill="url(#skyGrad)"/>
  {celestial_svg}
  <path d="{m_far}" fill="url(#mountFarGrad)" opacity="0.85"/>
  <path d="{m_mid}" fill="url(#mountMidGrad)" opacity="0.92"/>
  <path d="M -50 {h*0.56} C {w*0.3} {h*0.50} {w*0.6} {h*0.62} {w+50} {h*0.54}" stroke="{pal['mist']}" stroke-width="48" fill="none" filter="url(#blur)"/>
  <rect y="{h*0.75}" width="{w}" height="{h*0.25}" fill="{pal['water_color']}" opacity="0.38"/>
  <line x1="{w*0.1}" y1="{h*0.82}" x2="{w*0.35}" y2="{h*0.82}" stroke="{pal['water_color']}" stroke-width="1.8" opacity="0.35" stroke-linecap="round"/>
  <path d="{m_near}" fill="url(#mountNearGrad)"/>
  {feature_svg}
  {birds_svg}

  <!-- Vermilion Collector Seal -->
  <g transform="translate({w*0.88}, {h*0.10}) scale(0.9)">
    <rect x="0" y="0" width="44" height="44" rx="4" fill="none" stroke="{pal['accent']}" stroke-width="3" opacity="0.85"/>
    <text x="22" y="27" font-family="'Songti SC', 'Source Han Serif', serif" font-size="16" font-weight="bold" fill="{pal['accent']}" text-anchor="middle" opacity="0.9">诗境</text>
  </g>

  <!-- Title & Line Mark -->
  <g transform="translate(48, 54)" opacity="0.85">
    <text x="0" y="0" font-family="'Noto Serif SC', 'Source Han Serif', serif" font-size="18" fill="{pal['sky_bot']}" letter-spacing="4">{clean_title}</text>
    <text x="0" y="24" font-family="'Noto Serif SC', 'Source Han Serif', serif" font-size="14" fill="{pal['sky_bot']}" opacity="0.75" letter-spacing="2">句 {line_index + 1} / {total_lines}</text>
  </g>
</svg>"""
    return svg.strip()


def build_poem_assets(poems: list[dict[str, Any]]) -> None:
    print(f"Building line illustration assets for {len(poems)} poems...")
    for poem in poems:
        pid = poem["id"]
        p_dir = IMAGES_DIR / pid
        p_dir.mkdir(parents=True, exist_ok=True)
        total_lines = len(poem["lines"])
        for idx, line in enumerate(poem["lines"]):
            image_rel = f"images/{pid}/line_{idx+1}.svg"
            line["image"] = image_rel
            svg_path = TANG_SHI_DIR / image_rel
            if not svg_path.exists():
                svg_content = generate_ink_illustration_svg(
                    title=poem["title"],
                    line_text=line["text"],
                    line_index=idx,
                    total_lines=total_lines,
                    mood_tags=poem.get("tags", []),
                    palette_seed=len(pid) + idx,
                )
                svg_path.write_text(svg_content, encoding="utf-8")
    save_poems(poems)
    print("Done building poem assets.")


def add_poem(
    title: str,
    poet: str,
    lines_text: list[str],
    dynasty: str = "唐",
    form: str = "五言绝句",
    tags: list[str] | None = None,
    appreciation: str = "",
    translations: list[str] | None = None,
    explanations: list[str] | None = None,
) -> dict[str, Any]:
    poems = load_poems()
    slug = slugify(f"{poet}-{title}")
    existing_ids = {p["id"] for p in poems}
    candidate = slug
    counter = 2
    while candidate in existing_ids:
        candidate = f"{slug}-{counter}"
        counter += 1
    poem_id = candidate

    poem_lines: list[dict[str, Any]] = []
    total = len(lines_text)
    for i, line_str in enumerate(lines_text):
        line_clean = line_str.strip()
        pinyin_str = pinyin_for_text(line_clean)
        trans = translations[i] if (translations and i < len(translations)) else ""
        expl = explanations[i] if (explanations and i < len(explanations)) else ""
        img_rel = f"images/{poem_id}/line_{i+1}.svg"

        poem_lines.append({
            "line_no": i + 1,
            "text": line_clean,
            "pinyin": pinyin_str,
            "translation": trans,
            "explanation": expl,
            "image": img_rel,
            "image_prompt": f"Classical Chinese ink wash painting: {line_clean}, misty atmosphere.",
        })

    new_poem = {
        "id": poem_id,
        "title": title,
        "title_pinyin": pinyin_for_text(title),
        "poet": poet,
        "poet_pinyin": pinyin_for_text(poet),
        "dynasty": dynasty,
        "form": form,
        "tags": tags or ["唐诗", "经典"],
        "appreciation": appreciation,
        "lines": poem_lines,
    }

    p_dir = IMAGES_DIR / poem_id
    p_dir.mkdir(parents=True, exist_ok=True)
    for i, line in enumerate(poem_lines):
        svg_content = generate_ink_illustration_svg(
            title=title,
            line_text=line["text"],
            line_index=i,
            total_lines=total,
            mood_tags=new_poem["tags"],
            palette_seed=len(poem_id) + i,
        )
        (TANG_SHI_DIR / line["image"]).write_text(svg_content, encoding="utf-8")

    poems.append(new_poem)
    save_poems(poems)
    print(f"Successfully added: 《{title}》· {poet} (ID: {poem_id})")
    return new_poem


def import_poems_from_file(file_path: str) -> None:
    """Import poems from a JSON or structured text file."""
    path = Path(file_path)
    if not path.is_file():
        print(f"Error: file not found: {file_path}")
        return

    if path.suffix.lower() == ".json":
        items = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(items, dict):
            items = [items]
        for it in items:
            add_poem(
                title=it["title"],
                poet=it["poet"],
                lines_text=[l if isinstance(l, str) else l["text"] for l in it["lines"]],
                dynasty=it.get("dynasty", "唐"),
                form=it.get("form", "五言绝句"),
                tags=it.get("tags", ["唐诗", "经典"]),
                appreciation=it.get("appreciation", ""),
            )
    else:
        content = path.read_text(encoding="utf-8")
        sections = re.split(r"\n---+\n", content)
        for sec in sections:
            lines = [l.strip() for l in sec.strip().splitlines() if l.strip()]
            if not lines:
                continue
            meta = {}
            poem_lines = []
            in_lines = False
            for l in lines:
                if l.startswith("Lines:") or l.startswith("诗句:"):
                    in_lines = True
                    continue
                if in_lines:
                    poem_lines.append(l)
                elif ":" in l or "：" in l:
                    sep = ":" if ":" in l else "："
                    k, v = l.split(sep, 1)
                    meta[k.strip().lower()] = v.strip()
                else:
                    poem_lines.append(l)

            title = meta.get("title") or meta.get("诗名") or meta.get("题目")
            poet = meta.get("poet") or meta.get("诗人") or meta.get("作者")
            form = meta.get("form") or meta.get("体裁") or "五言绝句"
            tags_str = meta.get("tags") or meta.get("标签") or "唐诗"
            tags = [t.strip() for t in re.split(r"[,，、\s]+", tags_str) if t.strip()]
            apprec = meta.get("appreciation") or meta.get("赏析") or ""

            if title and poet and poem_lines:
                add_poem(
                    title=title,
                    poet=poet,
                    lines_text=poem_lines,
                    form=form,
                    tags=tags,
                    appreciation=apprec,
                )


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage Tang Poetry Collection")
    subparsers = parser.add_subparsers(dest="command")

    add_parser = subparsers.add_parser("add", help="Add a new poem")
    add_parser.add_argument("--title", required=True, help="Poem title (e.g. 早发白帝城)")
    add_parser.add_argument("--poet", required=True, help="Poet name (e.g. 李白)")
    add_parser.add_argument("--lines", nargs="+", required=True, help="Poem lines")
    add_parser.add_argument("--dynasty", default="唐", help="Dynasty (default: 唐)")
    add_parser.add_argument("--form", default="五言绝句", help="Form/Style (e.g. 七言绝句)")
    add_parser.add_argument("--tags", nargs="*", default=["唐诗", "经典"], help="Tags")
    add_parser.add_argument("--appreciation", default="", help="Poem appreciation")

    import_parser = subparsers.add_parser("import", help="Batch import poems from a file")
    import_parser.add_argument("--file", required=True, help="Path to JSON or TXT file")

    subparsers.add_parser("build-assets", help="Regenerate all line images and validate")
    subparsers.add_parser("validate", help="Validate poems data integrity")

    args = parser.parse_args()

    if args.command == "add":
        add_poem(
            title=args.title,
            poet=args.poet,
            lines_text=args.lines,
            dynasty=args.dynasty,
            form=args.form,
            tags=args.tags,
            appreciation=args.appreciation,
        )
    elif args.command == "import":
        import_poems_from_file(args.file)
    elif args.command == "build-assets":
        poems = load_poems()
        build_poem_assets(poems)
    elif args.command == "validate":
        poems = load_poems()
        print(f"Loaded {len(poems)} poems.")
        missing_images = 0
        for p in poems:
            for line in p.get("lines", []):
                img_path = TANG_SHI_DIR / line.get("image", "")
                if not img_path.is_file():
                    print(f"Missing image for {p['title']} Line {line.get('line_no')}: {img_path}")
                    missing_images += 1
        if missing_images == 0:
            print("All poem line images are valid and present!")
        else:
            print(f"Warning: {missing_images} missing images found.")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
