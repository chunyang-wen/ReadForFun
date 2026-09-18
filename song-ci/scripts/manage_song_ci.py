#!/usr/bin/env python3
"""Manage Song Ci collection data, pinyin annotation, and asset generation.

Features:
- Contains an extensive curated collection of 35 classic Song Ci masterpieces
- Parses each Ci into stanzas (上阕, 下阕), and segments sentences by terminal punctuation (。, ？, ！)
- Generates pinyin with tones and classical poetry pronunciation corrections
- Generates detailed modern translation, phrase/word annotations, and cultural allusions for each sentence
- Generates 1 comprehensive classical ink-and-wash SVG placeholder image per poem (cover.svg)
- Exports to data/ci.json and data/ci.js (window.__SONG_CI_DATA__)
"""

from __future__ import annotations

import argparse
import html
import json
import math
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
SONG_CI_DIR = REPO_ROOT / "song-ci"
DATA_DIR = SONG_CI_DIR / "data"
IMAGES_DIR = SONG_CI_DIR / "images"
JSON_FILE = DATA_DIR / "ci.json"
JS_FILE = DATA_DIR / "ci.js"

CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")

POETRY_PINYIN_CORRECTIONS = {
    "明月几时有": ["míng", "yuè", "jǐ", "shí", "yǒu"],
    "不知天上宫阙": ["bù", "zhī", "tiān", "shàng", "gōng", "què"],
    "今夕是何年": ["jīn", "xī", "shì", "hé", "nián"],
    "琼楼玉宇": ["qióng", "lóu", "yù", "yǔ"],
    "高处不胜寒": ["gāo", "chù", "bù", "shèng", "hán"],
    "起舞弄清影": ["qǐ", "wǔ", "nòng", "qīng", "yǐng"],
    "转朱阁": ["zhuǎn", "zhū", "gé"],
    "低绮户": ["dī", "qǐ", "hù"],
    "照无眠": ["zhào", "wú", "mián"],
    "千里共婵娟": ["qiān", "lǐ", "gòng", "chán", "juān"],
    "大江东去": ["dà", "jiāng", "dōng", "qù"],
    "浪淘尽": ["làng", "táo", "jìn"],
    "千古风流人物": ["qiān", "gǔ", "fēng", "liú", "rén", "wù"],
    "羽扇纶巾": ["yǔ", "shàn", "guān", "jīn"],
    "强虏灰飞烟灭": ["qiáng", "lǔ", "huī", "fēi", "yān", "miè"],
    "樯橹灰飞烟灭": ["qiáng", "lǔ", "huī", "fēi", "yān", "miè"],
    "一樽还酹江月": ["yī", "zūn", "huán", "lèi", "jiāng", "yuè"],
    "寻寻觅觅": ["xún", "xún", "mì", "mì"],
    "冷冷清清": ["lěng", "lěng", "qīng", "qīng"],
    "凄凄惨惨戚戚": ["qī", "qī", "cǎn", "cǎn", "qī", "qī"],
    "乍暖还寒时候": ["zhà", "nuǎn", "huán", "hán", "shí", "hòu"],
    "最难将息": ["zuì", "nán", "jiāng", "xī"],
    "雁过也": ["yàn", "guò", "yě"],
    "正伤心": ["zhèng", "shāng", "xīn"],
    "却是旧时相识": ["què", "shì", "jiù", "shí", "xiāng", "shí"],
    "满地黄花堆积": ["mǎn", "dì", "huáng", "huā", "duī", "jī"],
    "憔悴损": ["qiáo", "cuì", "sǔn"],
    "如今有谁堪摘": ["rú", "jīn", "yǒu", "shuí", "kān", "zhāi"],
    "梧桐更兼细雨": ["wú", "tóng", "gèng", "jiān", "xì", "yǔ"],
    "到黄昏": ["dào", "huáng", "hūn"],
    "点点滴滴": ["diǎn", "diǎn", "dī", "dī"],
    "这次第": ["zhè", "cì", "dì"],
    "怎一个愁字了得": ["zěn", "yī", "gè", "chóu", "zì", "liǎo", "dé"],
    "寒蝉凄切": ["hán", "chán", "qī", "qiè"],
    "对长亭晚": ["duì", "cháng", "tíng", "wǎn"],
    "骤雨初歇": ["zhòu", "yǔ", "chū", "xiē"],
    "都门帐饮无绪": ["dū", "mén", "zhàng", "yǐn", "wú", "xù"],
    "执手相看泪眼": ["zhí", "shǒu", "xiāng", "kàn", "lèi", "yǎn"],
    "竟无语凝噎": ["jìng", "wú", "yǔ", "níng", "yē"],
    "念去去": ["niàn", "qù", "qù"],
    "千里烟波": ["qiān", "lǐ", "yān", "bō"],
    "暮霭沉沉楚天阔": ["mù", "ǎi", "chén", "chén", "chǔ", "tiān", "kuò"],
    "多情自古伤离别": ["duō", "qíng", "zì", "gǔ", "shāng", "lí", "bié"],
    "更那堪": ["gèng", "nǎ", "kān"],
    "冷落清秋节": ["lěng", "luò", "qīng", "qiū", "jié"],
    "今宵酒醒何处": ["jīn", "xiāo", "jiǔ", "xǐng", "hé", "chù"],
    "杨柳岸": ["yáng", "liǔ", "àn"],
    "晓风残月": ["xiǎo", "fēng", "cán", "yuè"],
    "此去经年": ["cǐ", "qù", "jīng", "nián"],
    "应是良辰好景虚设": ["yīng", "shì", "liáng", "chén", "hǎo", "jǐng", "xū", "shè"],
    "便纵有千种风情": ["biàn", "zòng", "yǒu", "qiān", "zhǒng", "fēng", "qíng"],
    "更与何人说": ["gèng", "yǔ", "hé", "rén", "shuō"],
    "醉里挑灯看剑": ["zuì", "lǐ", "tiǎo", "dēng", "kàn", "jiàn"],
    "梦回吹角连营": ["mèng", "huí", "chuī", "jiǎo", "lián", "yíng"],
    "八百里分麾下炙": ["bā", "bǎi", "lǐ", "fēn", "huī", "xià", "zhì"],
    "五十弦翻塞外声": ["wǔ", "shí", "xián", "fān", "sài", "wài", "shēng"],
    "沙场秋点兵": ["shā", "chǎng", "qiū", "diǎn", "bīng"],
    "马作的卢飞快": ["mǎ", "zuò", "dì", "lú", "fēi", "kuài"],
    "弓如霹雳弦惊": ["gōng", "rú", "pī", "lì", "xián", "jīng"],
    "了却君王天下事": ["liǎo", "què", "jūn", "wáng", "tiān", "xià", "shì"],
    "赢得生前身后名": ["yíng", "dé", "shēng", "qián", "shēn", "hòu", "míng"],
    "可怜白发生": ["kě", "lián", "bái", "fà", "shēng"],
}


def pinyin_for_text(text: str) -> str:
    """Return tone-marked pinyin tokens for Han characters in text."""
    try:
        from pypinyin import Style, lazy_pinyin
    except ImportError:
        return ""

    tokens: list[str] = []
    cleaned = re.sub(r"[^\u3400-\u4dbf\u4e00-\u9fff]+", " ", text).strip()
    words = cleaned.split()

    for word in words:
        if word in POETRY_PINYIN_CORRECTIONS:
            tokens.extend(POETRY_PINYIN_CORRECTIONS[word])
        else:
            matched_custom = False
            for phrase, c_toks in POETRY_PINYIN_CORRECTIONS.items():
                if phrase in word and len(phrase) == len(word):
                    tokens.extend(c_toks)
                    matched_custom = True
                    break
            if not matched_custom:
                tokens.extend(lazy_pinyin(word, style=Style.TONE, neutral_tone_with_five=True))
    return " ".join(tokens)


def slugify(text: str) -> str:
    try:
        from pypinyin import Style, lazy_pinyin
        parts = lazy_pinyin(text, style=Style.NORMAL)
        slug = "-".join("".join(p for p in part if p.isalnum()) for part in parts if part)
        slug = re.sub(r"-+", "-", slug).strip("-").lower()
        return slug or "song-ci"
    except Exception:
        return re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower() or "song-ci"


def generate_ink_illustration_svg(
    ci_title: str,
    full_text: str,
    ci_index: int,
    mood_tags: list[str],
    author: str = "",
) -> str:
    """Generate a grand Song dynasty ink-and-wash SVG placeholder for the entire poem.
    
    Dimensions: 1080 x 720 (3:2 ratio, ideal for responsive layout & high-DPI).
    """
    w, h = 1080, 720

    combined_content = f"{ci_title} {full_text} {' '.join(mood_tags)}"

    has_moon = any(k in combined_content for k in ["月", "夜", "夕", "宵", "星", "明月", "残月", "阴晴圆缺"])
    has_sun = any(k in combined_content for k in ["日", "晨", "曛", "晴", "昼", "残阳", "斜阳", "落日"])
    has_water = any(k in combined_content for k in ["江", "水", "河", "海", "川", "浪", "涛", "波", "潮", "溪", "湖", "渚", "烟波", "沧浪"])
    has_boat = any(k in combined_content for k in ["舟", "船", "帆", "棹", "舫", "客船"])
    has_mountain = any(k in combined_content for k in ["山", "峰", "岭", "岩", "赤壁", "关", "塞", "重山", "千岩"])
    has_willow = any(k in combined_content for k in ["柳", "杨柳", "垂柳", "柳岸"])
    has_rain = any(k in combined_content for k in ["雨", "骤雨", "细雨", "烟雨", "风雨", "霖", "滴"])
    has_snow = any(k in combined_content for k in ["雪", "霜", "冰", "冷", "寒", "玉簟", "寒蝉"])
    has_architecture = any(k in combined_content for k in ["楼", "阁", "亭", "阙", "台", "殿", "门", "城", "长亭", "危楼", "琼楼"])
    has_war = any(k in combined_content for k in ["剑", "弓", "马", "兵", "营", "角", "烽", "沙场", "霹雳", "旗", "金戈", "铁马", "北固"])
    has_flowers = any(k in combined_content for k in ["花", "黄花", "梅", "残红", "杏", "桃", "菊", "莲", "藕"])
    has_birds = any(k in combined_content for k in ["鸟", "雁", "燕", "莺", "蝉", "鹤", "鸥"])

    palettes = [
        # 0: Ru Ware Celadon (汝窑天青)
        {
            "name": "天青墨韵",
            "bg_top": "#1a2a30", "bg_mid": "#2f4852", "bg_bot": "#dbe3e5",
            "m_far": "#426570", "m_mid": "#24404a", "m_near": "#10232a",
            "accent": "#c25d48", "sun_moon": "#f2ebd9", "water": "#233d45",
            "mist": "rgba(225, 235, 235, 0.45)", "gold": "#d4af37"
        },
        # 1: Moonlit Indigo (幽夜冷月)
        {
            "name": "幽夜苍茫",
            "bg_top": "#090d16", "bg_mid": "#162035", "bg_bot": "#2d3d59",
            "m_far": "#202e47", "m_mid": "#131d30", "m_near": "#080c14",
            "accent": "#e0a96d", "sun_moon": "#fef6e4", "water": "#101826",
            "mist": "rgba(180, 205, 235, 0.30)", "gold": "#e9c46a"
        },
        # 2: Autumn Ochre & Sunset (长河落日 / 残阳塞上)
        {
            "name": "塞外秋阳",
            "bg_top": "#2e1810", "bg_mid": "#6e3b24", "bg_bot": "#f0dfcf",
            "m_far": "#5e3a29", "m_mid": "#3d2116", "m_near": "#1f0f09",
            "accent": "#bf360c", "sun_moon": "#ff7043", "water": "#4e2c1e",
            "mist": "rgba(245, 225, 210, 0.40)", "gold": "#ffa726"
        },
        # 3: Jiangnan Spring & Willow (烟雨江南)
        {
            "name": "江南烟雨",
            "bg_top": "#1c261e", "bg_mid": "#3e5241", "bg_bot": "#eaf0eb",
            "m_far": "#48634d", "m_mid": "#273b2b", "m_near": "#122016",
            "accent": "#c65146", "sun_moon": "#eae6d1", "water": "#2a4030",
            "mist": "rgba(230, 240, 235, 0.55)", "gold": "#85a36c"
        },
        # 4: Martial Iron & Bronze (铁马冰河 / 豪放沙场)
        {
            "name": "金戈铁马",
            "bg_top": "#1a1818", "bg_mid": "#3a3230", "bg_bot": "#d6cec9",
            "m_far": "#524744", "m_mid": "#302624", "m_near": "#160f0d",
            "accent": "#b71c1c", "sun_moon": "#e65100", "water": "#2d2422",
            "mist": "rgba(220, 210, 205, 0.35)", "gold": "#d4af37"
        },
    ]

    if has_war or "金戈" in combined_content or "沙场" in combined_content:
        pal = palettes[4]
    elif has_moon:
        pal = palettes[1]
    elif has_snow or "寒" in combined_content or "凄切" in combined_content:
        pal = palettes[1]
    elif has_rain or has_willow or "春" in combined_content or "花" in combined_content:
        pal = palettes[3]
    elif has_sun or "秋" in combined_content or "黄昏" in combined_content:
        pal = palettes[2]
    else:
        pal = palettes[(ci_index) % len(palettes)]

    seed_factor = (ci_index * 43) % 100
    m_far_y = h * 0.50 + seed_factor * 0.35
    m_mid_y = h * 0.64 + seed_factor * 0.25
    m_near_y = h * 0.78 + seed_factor * 0.18

    far_path = f"M 0 {m_far_y} Q {w*0.22} {h*0.32} {w*0.46} {m_far_y-20} T {w*0.84} {h*0.36} L {w} {m_far_y+10} L {w} {h} L 0 {h} Z"
    mid_path = f"M 0 {m_mid_y} C {w*0.18} {h*0.48} {w*0.35} {h*0.58} {w*0.58} {h*0.44} S {w*0.88} {h*0.60} {w} {h*0.54} L {w} {h} L 0 {h} Z"
    near_path = f"M 0 {m_near_y} C {w*0.25} {h*0.72} {w*0.50} {h*0.82} {w*0.75} {h*0.74} S {w*0.92} {h*0.80} {w} {h*0.76} L {w} {h} L 0 {h} Z"

    celestial_svg = ""
    if has_moon:
        if "残月" in combined_content or "缺" in combined_content:
            celestial_svg = f"""
            <g transform="translate({w*0.82}, {h*0.22})" filter="url(#glow_{ci_index})">
                <path d="M 0 -35 A 35 35 0 1 0 0 35 A 28 35 0 0 1 0 -35 Z" fill="{pal['sun_moon']}" opacity="0.92"/>
            </g>
            """
        else:
            celestial_svg = f"""
            <g transform="translate({w*0.78}, {h*0.22})">
                <circle cx="0" cy="0" r="46" fill="{pal['sun_moon']}" filter="url(#softGlow_{ci_index})" opacity="0.95"/>
                <circle cx="0" cy="0" r="54" fill="none" stroke="{pal['sun_moon']}" stroke-width="1.5" opacity="0.3" filter="url(#glow_{ci_index})"/>
            </g>
            """
    elif has_sun or "夕" in combined_content or "阳" in combined_content or "日" in combined_content:
        celestial_svg = f"""
        <circle cx="{w*0.24}" cy="{h*0.28}" r="50" fill="{pal['sun_moon']}" opacity="0.85" filter="url(#glow_{ci_index})"/>
        """

    features = []

    if has_architecture or "阙" in combined_content:
        features.append(f"""
        <g transform="translate({w*0.68}, {h*0.46}) scale(0.9)" fill="{pal['m_near']}">
            <path d="M -60 20 C -40 10 -20 8 0 18 C 20 8 40 10 60 20 L 52 26 L -52 26 Z"/>
            <path d="M -80 50 C -50 36 -20 32 0 46 C 20 32 50 36 80 50 L 72 58 L -72 58 Z"/>
            <rect x="-35" y="26" width="6" height="24"/>
            <rect x="29" y="26" width="6" height="24"/>
            <rect x="-5" y="26" width="10" height="24"/>
            <rect x="-55" y="58" width="6" height="36"/>
            <rect x="49" y="58" width="6" height="36"/>
            <rect x="-20" y="58" width="8" height="36"/>
            <rect x="12" y="58" width="8" height="36"/>
            <polygon points="-90,94 90,94 105,120 -105,120" opacity="0.95"/>
        </g>
        """)

    if has_boat or (has_water and not has_architecture):
        features.append(f"""
        <g transform="translate({w*0.38}, {h*0.75}) scale(0.9)" fill="{pal['m_near']}">
            <path d="M -60 6 Q 0 24 70 4 Q 10 14 -50 14 Z"/>
            <path d="M -15 6 Q 5 -12 25 6 Z" fill="{pal['m_mid']}"/>
            <circle cx="-25" cy="-2" r="5"/>
            <path d="M -26 2 L -20 10" stroke="{pal['m_near']}" stroke-width="2.5"/>
            <line x1="-28" y1="2" x2="-45" y2="18" stroke="{pal['m_near']}" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M -80 18 Q -40 22 0 17 Q 40 22 90 18" fill="none" stroke="{pal['accent']}" stroke-width="1.2" opacity="0.5" stroke-dasharray="8,6"/>
        </g>
        """)

    if has_willow or "春" in combined_content:
        features.append(f"""
        <g stroke="{pal['m_near']}" fill="{pal['m_near']}" opacity="0.9">
            <path d="M 0 {h*0.28} Q {w*0.10} {h*0.32} {w*0.18} {h*0.46} T {w*0.22} {h*0.62}" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M {w*0.12} {h*0.35} Q {w*0.20} {h*0.38} {w*0.28} {h*0.50}" stroke-width="4.5" fill="none"/>
            <path d="M {w*0.18} {h*0.46} Q {w*0.21} {h*0.60} {w*0.19} {h*0.72}" stroke-width="2.2" stroke-dasharray="5,3" fill="none" stroke="{pal['accent']}"/>
            <path d="M {w*0.22} {h*0.44} Q {w*0.26} {h*0.58} {w*0.24} {h*0.70}" stroke-width="1.8" stroke-dasharray="6,4" fill="none" stroke="{pal['accent']}"/>
            <path d="M {w*0.15} {h*0.40} Q {w*0.14} {h*0.54} {w*0.12} {h*0.68}" stroke-width="1.8" stroke-dasharray="5,4" fill="none" stroke="{pal['accent']}"/>
            <circle cx="{w*0.18}" cy="{h*0.46}" r="7" fill="{pal['gold']}" opacity="0.8"/>
            <circle cx="{w*0.22}" cy="{h*0.44}" r="6" fill="{pal['gold']}" opacity="0.8"/>
        </g>
        """)

    if has_birds or "雁" in combined_content or "云" in combined_content:
        features.append(f"""
        <g opacity="0.75" stroke="{pal['m_mid']}" stroke-width="2.4" stroke-linecap="round" fill="none">
            <path d="M {w*0.58} {h*0.18} Q {w*0.59} {h*0.17} {w*0.60} {h*0.19} Q {w*0.61} {h*0.17} {w*0.62} {h*0.18}"/>
            <path d="M {w*0.63} {h*0.15} Q {w*0.64} {h*0.14} {w*0.65} {h*0.16} Q {w*0.66} {h*0.14} {w*0.67} {h*0.15}"/>
            <path d="M {w*0.68} {h*0.20} Q {w*0.69} {h*0.19} {w*0.70} {h*0.21} Q {w*0.71} {h*0.19} {w*0.72} {h*0.20}"/>
            <path d="M {w*0.73} {h*0.17} Q {w*0.74} {h*0.16} {w*0.75} {h*0.18} Q {w*0.76} {h*0.16} {w*0.77} {h*0.17}"/>
        </g>
        """)

    if has_war:
        features.append(f"""
        <g transform="translate({w*0.35}, {h*0.65}) scale(0.95)" fill="{pal['m_near']}">
            <line x1="0" y1="-80" x2="0" y2="40" stroke="{pal['m_near']}" stroke-width="4.5"/>
            <path d="M 0 -75 Q 35 -65 50 -80 L 45 -45 Q 25 -35 0 -48 Z" fill="{pal['accent']}" opacity="0.85"/>
            <line x1="-30" y1="-50" x2="-20" y2="35" stroke="{pal['m_near']}" stroke-width="3"/>
            <polygon points="-33,-65 -27,-65 -30,-80" fill="{pal['gold']}"/>
            <line x1="30" y1="-55" x2="20" y2="35" stroke="{pal['m_near']}" stroke-width="3"/>
            <polygon points="27,-70 33,-70 30,-85" fill="{pal['gold']}"/>
        </g>
        """)

    seal_char = (author or "宋")[:1]
    banner_label = f"《{ci_title}》· {author}"

    svg_code = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad_{ci_index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{pal['bg_top']}"/>
      <stop offset="55%" stop-color="{pal['bg_mid']}"/>
      <stop offset="100%" stop-color="{pal['bg_bot']}"/>
    </linearGradient>

    <linearGradient id="mistGrad_{ci_index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{pal['bg_bot']}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="{pal['mist']}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="{pal['bg_bot']}" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="waterGrad_{ci_index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{pal['water']}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="{pal['m_near']}" stop-opacity="0.95"/>
    </linearGradient>

    <filter id="glow_{ci_index}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="softGlow_{ci_index}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="24" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="{w}" height="{h}" fill="url(#skyGrad_{ci_index})"/>

  {celestial_svg}

  <path d="{far_path}" fill="{pal['m_far']}" opacity="0.6"/>

  <rect x="0" y="{h*0.48}" width="{w}" height="{h*0.14}" fill="url(#mistGrad_{ci_index})" opacity="0.75"/>

  <path d="{mid_path}" fill="{pal['m_mid']}" opacity="0.82"/>

  <rect x="0" y="{h*0.62}" width="{w}" height="{h*0.12}" fill="url(#mistGrad_{ci_index})" opacity="0.65"/>

  <rect x="0" y="{h*0.72}" width="{w}" height="{h*0.28}" fill="url(#waterGrad_{ci_index})"/>

  <path d="{near_path}" fill="{pal['m_near']}"/>

  {''.join(features)}

  <line x1="{w*0.2}" y1="{h*0.84}" x2="{w*0.5}" y2="{h*0.84}" stroke="{pal['gold']}" stroke-width="1.5" opacity="0.25" stroke-dasharray="14,20"/>
  <line x1="{w*0.4}" y1="{h*0.88}" x2="{w*0.75}" y2="{h*0.88}" stroke="{pal['gold']}" stroke-width="1.2" opacity="0.2" stroke-dasharray="18,24"/>

  <rect x="24" y="24" width="{w-48}" height="{h-48}" fill="none" stroke="{pal['gold']}" stroke-width="1" opacity="0.3"/>
  <rect x="30" y="30" width="{w-60}" height="{h-60}" fill="none" stroke="{pal['bg_bot']}" stroke-width="0.75" opacity="0.2"/>

  <g transform="translate({w - 100}, 48)">
    <rect x="0" y="0" width="56" height="56" rx="4" fill="#a82810" stroke="#d47963" stroke-width="1.8" opacity="0.88"/>
    <text x="28" y="38" font-family="'Songti SC', 'SimSun', serif" font-size="28" font-weight="bold" fill="#fff5ea" text-anchor="middle" opacity="0.95">{seal_char}</text>
  </g>

  <g transform="translate(48, {h - 48})">
    <rect x="-12" y="-32" width="{min(len(banner_label)*24 + 40, w - 160)}" height="42" rx="4" fill="rgba(12, 16, 20, 0.72)" stroke="{pal['gold']}" stroke-width="0.8" opacity="0.9"/>
    <text x="4" y="-5" font-family="'Kaiti SC', 'STKaiti', serif" font-size="19" fill="#f4ebd9" letter-spacing="1.5">{html.escape(banner_label)}</text>
  </g>
</svg>
"""
    return svg_code.strip()


def build_song_ci_database() -> list[dict[str, Any]]:
    """Return the complete canonical Song Ci anthology."""
    from song_ci_corpus import RAW_SONG_CI_COLLECTION

    processed_ci_list = []

    for item in RAW_SONG_CI_COLLECTION:
        ci_id = item["id"]
        title = item["title"]
        cipai = item["cipai"]
        subtitle = item.get("subtitle", "")
        author = item["author"]
        dynasty = item.get("dynasty", "宋")
        form = item.get("form", "双调")
        preface = item.get("preface", "")
        tags = item.get("tags", ["宋词", "经典"])
        appreciation = item.get("appreciation", "")
        raw_stanzas = item["stanzas"]

        stanzas_data = []
        flat_sentences = []
        global_idx = 0

        for s_idx, st in enumerate(raw_stanzas):
            s_name = st["name"]
            raw_sentences = st["sentences"]
            st_sentences_data = []

            for sent_no, sent in enumerate(raw_sentences, 1):
                raw_text = sent["text"].strip()
                translation = sent.get("translation", "")
                explanation = sent.get("explanation", "")

                pinyin = sent.get("pinyin") or pinyin_for_text(raw_text)

                clause_matches = re.findall(r"[^，,、；;。？！!?]+[，,、；;。？！!?]?", raw_text)
                clauses = []
                for c in clause_matches:
                    c = c.strip()
                    if c:
                        clauses.append({
                            "text": c,
                            "pinyin": pinyin_for_text(c)
                        })

                sentence_obj = {
                    "global_index": global_idx,
                    "stanza_no": s_idx + 1,
                    "stanza_name": s_name,
                    "sentence_no": sent_no,
                    "text": raw_text,
                    "pinyin": pinyin,
                    "clauses": clauses,
                    "translation": translation,
                    "explanation": explanation,
                }

                st_sentences_data.append(sentence_obj)
                flat_sentences.append(sentence_obj)
                global_idx += 1

            stanzas_data.append({
                "name": s_name,
                "stanza_no": s_idx + 1,
                "sentences": st_sentences_data,
            })

        cover_img_rel = f"images/{ci_id}/cover.svg"

        processed_ci_list.append({
            "id": ci_id,
            "title": title,
            "cipai": cipai,
            "subtitle": subtitle,
            "title_pinyin": pinyin_for_text(title),
            "author": author,
            "author_pinyin": pinyin_for_text(author),
            "dynasty": dynasty,
            "form": form,
            "image": cover_img_rel,
            "preface": preface,
            "preface_pinyin": pinyin_for_text(preface) if preface else "",
            "tags": tags,
            "appreciation": appreciation,
            "stanzas": stanzas_data,
            "sentences": flat_sentences,
        })

    return processed_ci_list


def generate_all_assets(ci_list: list[dict[str, Any]]) -> None:
    """Generate 1 SVG image asset per poem."""
    print("Generating 1 SVG artwork placeholder per poem...")
    total_generated = 0

    for idx, ci in enumerate(ci_list):
        ci_id = ci["id"]
        ci_dir = IMAGES_DIR / ci_id
        ci_dir.mkdir(parents=True, exist_ok=True)

        # Remove previous sentence-level scene_*.svg if existing
        for old_scene in ci_dir.glob("scene_*.svg"):
            try:
                old_scene.unlink()
            except Exception:
                pass

        target_path = ci_dir / "cover.svg"
        full_text = " ".join(s["text"] for s in ci["sentences"])

        svg_content = generate_ink_illustration_svg(
            ci_title=ci["title"],
            full_text=full_text,
            ci_index=idx,
            mood_tags=ci["tags"],
            author=ci["author"],
        )
        target_path.write_text(svg_content, encoding="utf-8")
        total_generated += 1

    print(f"Successfully created {total_generated} poem-level artworks across {len(ci_list)} Song Ci works.")


def save_dataset(ci_list: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    JSON_FILE.write_text(json.dumps(ci_list, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    
    js_content = "/** Song Ci Dataset */\nwindow.__SONG_CI_DATA__ = " + json.dumps(ci_list, ensure_ascii=False, indent=2) + ";\n"
    JS_FILE.write_text(js_content, encoding="utf-8")
    print(f"Saved dataset to {JSON_FILE} and {JS_FILE}")


def validate_dataset(ci_list: list[dict[str, Any]]) -> bool:
    print(f"Validating {len(ci_list)} Song Ci works...")
    errors = 0

    for ci in ci_list:
        if not ci.get("id"):
            print(f"Error: missing id in {ci.get('title')}")
            errors += 1
        if not ci.get("image"):
            print(f"Error: missing image property in {ci.get('id')}")
            errors += 1
        else:
            img_path = SONG_CI_DIR / ci["image"]
            if not img_path.is_file():
                print(f"Missing cover image: {img_path} for {ci['id']}")
                errors += 1
        if not ci.get("stanzas"):
            print(f"Error: no stanzas in {ci.get('id')}")
            errors += 1
        for sent in ci.get("sentences", []):
            last_char = sent["text"].strip()[-1] if sent["text"].strip() else ""
            if last_char not in "。？！!?":
                print(f"Warning: Sentence does not end in standard terminal mark (。？！): '{sent['text']}' in {ci['id']}")

    if errors == 0:
        print("Dataset validation passed! All stanzas, sentences, and poem-level artwork assets are intact.")
        return True
    else:
        print(f"Validation failed with {errors} errors.")
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage Song Ci Collection")
    parser.add_argument("--action", choices=["build-all", "validate"], default="build-all", help="Action to perform")
    args = parser.parse_args()

    ci_list = build_song_ci_database()

    if args.action == "build-all":
        generate_all_assets(ci_list)
        save_dataset(ci_list)
        validate_dataset(ci_list)
    elif args.action == "validate":
        validate_dataset(ci_list)


if __name__ == "__main__":
    main()
