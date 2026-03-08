import os
import re
import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageEnhance

# Optional environment-based config
TESSERACT_PATH = os.getenv("TESSERACT_PATH")
if TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


# -------------------------------------------------
# Image Preprocessing
# -------------------------------------------------

def preprocess_image(path: str):
    img = Image.open(path).convert("L")
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = np.array(img)
    img = cv2.fastNlMeansDenoising(img, None, 20, 7, 21)
    return img


# -------------------------------------------------
# Text Utilities
# -------------------------------------------------

def normalize(text: str):
    return re.sub(r"\s+", " ", text.replace("(", " ").replace(")", " "))


def to_float(value: str):
    return float(value.replace(",", "."))


# -------------------------------------------------
# Field Extraction
# -------------------------------------------------

def extract_fields(text: str):
    text = normalize(text)

    def find(pattern):
        m = re.search(pattern, text, re.I)
        return m.group(1).strip() if m else None

    # UMIS
    umis_no = find(r"UMIS\s*NO\s*[:\-]?\s*(\d+)")

    # GPA (more tolerant)
    gpa_match = re.search(
        r"(GPA|GRADE POINT AVERAGE)[^0-9]{0,20}([\d]+[.,][\d]+)",
        text,
        re.I
    )
    gpa = to_float(gpa_match.group(2)) if gpa_match else None

    # CGPA
    cgpa_match = re.search(
        r"(CGPA|CUMULATIVE GRADE POINT AVERAGE)[^0-9]{0,20}([\d]+[.,][\d]+)",
        text,
        re.I
    )

    if cgpa_match:
        cgpa = to_float(cgpa_match.group(2))
    elif re.search(r"CGPA\s*[\*\.]{2,}", text):
        cgpa = "WITHHELD"
    else:
        cgpa = None

    # Subjects
    subjects = re.findall(
        r"\b([A-Z]{2,4}\d{2,4})\s+[A-Z &]+\s+\d+\s+\d+\s+([A-Z+]{1,2})",
        text
    )

    subject_grades = [{"code": code, "grade": grade} for code, grade in subjects]

    return {
        "umis_no": umis_no,
        "subject_grades": subject_grades,
        "gpa": gpa,
        "cgpa": cgpa
    }


# -------------------------------------------------
# OCR ENTRY POINT
# -------------------------------------------------

def run_ocr(path: str):
    try:
        img = preprocess_image(path)

        text = pytesseract.image_to_string(
            img,
            lang="eng",
            config="--oem 3 --psm 6"
        )

        return extract_fields(text)

    except Exception as e:
        print("OCR ERROR:", e)
        return {
            "umis_no": None,
            "subject_grades": [],
            "gpa": None,
            "cgpa": None
        }
