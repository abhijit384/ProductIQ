import io
import os
import csv
import pandas as pd
from typing import List, Dict, Any, Tuple

def parse_csv_bytes(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], List[str]]:
    # Try multiple encodings
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    text = None
    for enc in encodings:
        try:
            text = file_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue
            
    if text is None:
        text = file_bytes.decode("utf-8", errors="replace")

    # Detect delimiter
    sample = text[:4096]
    delimiter = ","
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample)
        delimiter = dialect.delimiter
    except Exception:
        if "\t" in sample and sample.count("\t") > sample.count(","):
            delimiter = "\t"
        elif ";" in sample and sample.count(";") > sample.count(","):
            delimiter = ";"

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    fieldnames = [f.strip() for f in (reader.fieldnames or [])]
    rows = []
    for r in reader:
        # Clean keys
        clean_row = {k.strip(): (v.strip() if v else "") for k, v in r.items() if k}
        rows.append(clean_row)
        
    return rows, fieldnames

def parse_xlsx_bytes(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], List[str]]:
    df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
    # Replace NaN with empty string
    df = df.fillna("")
    fieldnames = [str(c).strip() for c in df.columns]
    rows = df.to_dict(orient="records")
    clean_rows = []
    for r in rows:
        clean_rows.append({str(k).strip(): str(v).strip() if v is not None else "" for k, v in r.items()})
    return clean_rows, fieldnames

def parse_file(file_bytes: bytes, filename: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    ext = os.path.splitext(filename)[1].lower()
    if ext in [".xlsx", ".xls"]:
        return parse_xlsx_bytes(file_bytes)
    elif ext in [".csv", ".tsv", ".txt"]:
        return parse_csv_bytes(file_bytes)
    else:
        # Default attempt CSV
        try:
            return parse_csv_bytes(file_bytes)
        except Exception:
            return parse_xlsx_bytes(file_bytes)
