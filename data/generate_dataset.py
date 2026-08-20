import csv
import random
import os
import pandas as pd

random.seed(42)

CATEGORIES = {
    "Industrial Motors": {
        "subcategories": ["Three-Phase Induction Motor", "Synchronous Motor", "Explosion-Proof Motor", "Servo Motor", "DC Traction Motor"],
        "brands": ["ABB", "Siemens", "WEG", "Baldor-Reliance", "Nidec", "SEW-Eurodrive"],
        "voltages": ["400 V", "400V", "400 volts", "380-415 V", "0.4 kV", "690 V", "230/400V", "460 V AC"],
        "powers": ["15 kW", "15 KW", "15000 W", "15kw", "20 HP", "22 kW", "7.5 kW", "7.5KW", "10 HP", "45 kW", "110 kW"],
        "frequencies": ["50 Hz", "50Hz", "60 Hz", "50/60 Hz", "50hz"],
        "rpms": ["1450 RPM", "1500 rpm", "2950 RPM", "3000 RPM", "980 rpm", "1750 RPM"],
        "ip_ratings": ["IP55", "IP56", "IP65", "IP66", "IP23", "ip55", "IP 55", ""],
        "materials": ["Cast Iron", "Aluminum", "Stainless Steel", "Ductile Iron"],
        "prefix": "MTR"
    },
    "Pumps": {
        "subcategories": ["Centrifugal Pump", "Submersible Slurry Pump", "Positive Displacement Pump", "Diaphragm Pump", "Multistage High-Pressure Pump"],
        "brands": ["Grundfos", "KSB", "Flowserve", "Sulzer", "Wilo", "Xylem"],
        "voltages": ["230 V", "400 V", "415V", "400v", "380 V 3-Phase", "24 V DC"],
        "powers": ["5.5 kW", "7.5 kW", "11 kW", "15 kW", "3.7 kW", "5 HP", "15 HP"],
        "frequencies": ["50 Hz", "60 Hz", "50/60 Hz"],
        "rpms": ["2900 RPM", "1450 RPM", "3500 rpm"],
        "ip_ratings": ["IP68", "IP55", "IP66", "ip68", "IP 68"],
        "materials": ["Stainless Steel 316", "Cast Iron GG25", "Bronze", "Duplex Steel"],
        "prefix": "PMP"
    },
    "Valves": {
        "subcategories": ["Pneumatic Ball Valve", "Globe Control Valve", "Butterfly Valve", "High-Pressure Gate Valve", "Check Valve"],
        "brands": ["Emerson Fisher", "Samson", "Bray", "Velan", "Flowserve", "Kitz"],
        "voltages": ["24 V DC", "24VDC", "230 V AC", "110 VAC", "N/A", "None", ""],
        "powers": ["0.05 kW", "50 W", "N/A", "", "15 W"],
        "frequencies": ["N/A", "50 Hz", "60 Hz", ""],
        "rpms": ["N/A", ""],
        "ip_ratings": ["IP67", "IP65", "NEMA 4X", "IP66", ""],
        "materials": ["CF8M Stainless", "WCB Carbon Steel", "Forged Steel A105", "Hastelloy C"],
        "prefix": "VLV"
    },
    "Sensors": {
        "subcategories": ["Pressure Transmitter", "Radar Level Sensor", "Electromagnetic Flowmeter", "Vibration Sensor", "RTD Temp Sensor"],
        "brands": ["Endress+Hauser", "Yokogawa", "Emerson Rosemount", "IFM Electronic", "Sick", "Honeywell"],
        "voltages": ["24 V DC", "12-30 VDC", "24V DC", "LOOP POWERED", "4-20mA 24V"],
        "powers": ["2 W", "5 W", "0.01 kW", "< 3W", "1.5 W"],
        "frequencies": ["DC", "50/60 Hz", "N/A"],
        "rpms": ["N/A"],
        "ip_ratings": ["IP67", "IP68", "IP69K", "ip67", "IP 67"],
        "materials": ["316L SS", "Hastelloy", "PVDF", "Titanium"],
        "prefix": "SNS"
    },
    "Bearings": {
        "subcategories": ["Deep Groove Ball Bearing", "Spherical Roller Bearing", "Tapered Roller Bearing", "Cylindrical Roller Bearing", "Pillow Block Bearing"],
        "brands": ["SKF", "NSK", "FAG Schaeffler", "Timken", "NTN", "Koyo"],
        "voltages": ["N/A", ""],
        "powers": ["N/A", ""],
        "frequencies": ["N/A"],
        "rpms": ["4500 max RPM", "6000 RPM", "3200 RPM", "8500 rpm"],
        "ip_ratings": ["N/A", "2RS Sealed", "ZZ Shielded", "Open"],
        "materials": ["High Carbon Chrome Steel 100Cr6", "Stainless Steel 440C", "Ceramic Hybrid"],
        "prefix": "BRG"
    },
    "Compressors": {
        "subcategories": ["Rotary Screw Compressor", "Reciprocating Air Compressor", "Centrifugal Turbo Compressor", "Oil-Free Scroll Compressor", "Vane Compressor"],
        "brands": ["Atlas Copco", "Ingersoll Rand", "Kaeser", "Sullair", "Boge", "Gardner Denver"],
        "voltages": ["400 V", "400V 50Hz", "460 V 60Hz", "3.3 kV", "400 volts"],
        "powers": ["37 kW", "55 kW", "75 kW", "110 kW", "22 kW", "50 HP", "100 HP", "75KW"],
        "frequencies": ["50 Hz", "60 Hz"],
        "rpms": ["2950 RPM", "3000 rpm", "1480 RPM"],
        "ip_ratings": ["IP54", "IP55", "IP65"],
        "materials": ["Heavy Gauge Steel Housing", "Cast Iron Block", "Acoustic Enclosure"],
        "prefix": "CMP"
    },
    "Control Systems": {
        "subcategories": ["Programmable Logic Controller (PLC)", "Distributed Control System (DCS) Module", "Variable Frequency Drive (VFD)", "Human Machine Interface (HMI)", "Safety Relay"],
        "brands": ["Siemens SIMATIC", "Rockwell Allen-Bradley", "Schneider Electric", "Mitsubishi Electric", "ABB Ability", "Omron"],
        "voltages": ["24 V DC", "230 V AC", "400 V 3PH", "24VDC / 120VAC", "24vdc"],
        "powers": ["0.75 kW", "1.5 kW", "7.5 kW", "15 kW", "30 W", "150 W", "22 kW"],
        "frequencies": ["50/60 Hz", "0-400 Hz Output", "50 Hz"],
        "rpms": ["N/A"],
        "ip_ratings": ["IP20", "IP65 Bezel", "IP20 / NEMA 1", "ip20"],
        "materials": ["Polycarbonate / Aluminum", "Industrial Thermoplastic", "Metal Alloy"],
        "prefix": "CTL"
    },
    "Electrical Components": {
        "subcategories": ["Air Circuit Breaker (ACB)", "Molded Case Circuit Breaker (MCCB)", "Vacuum Contactor", "Industrial Transformer", "Surge Protection Device"],
        "brands": ["Schneider Electric", "ABB", "Eaton", "Siemens", "Legrand", "Chint"],
        "voltages": ["400 V", "690 V", "1000 V", "11 kV", "230/400V", "415 VAC"],
        "powers": ["N/A", "100 kVA", "250 kVA", "630 A Rating", "1600 A Rating"],
        "frequencies": ["50 Hz", "50/60 Hz", "60 Hz"],
        "rpms": ["N/A"],
        "ip_ratings": ["IP40", "IP54", "IP20", "IP30"],
        "materials": ["DMC Polyester Glass", "Thermoset Resin", "Silver Alloy Contacts"],
        "prefix": "ELC"
    },
    "Safety Equipment": {
        "subcategories": ["Safety Light Curtain", "Emergency Stop Rope Pull", "Explosion Proof Beacon", "Gas Detection Monitor", "Interlock Switch"],
        "brands": ["Pilz", "Sick", "Euchner", "Banner Engineering", "Honeywell Analytics", "Pepperl+Fuchs"],
        "voltages": ["24 V DC", "24VDC", "110-230 VAC", "Battery / 3.6V"],
        "powers": ["5 W", "10 W", "15 W", "0.02 kW"],
        "frequencies": ["DC", "50/60 Hz"],
        "rpms": ["N/A"],
        "ip_ratings": ["IP67", "IP69K", "IP65", "IP66", "Ex d IIC T6"],
        "materials": ["Anodized Aluminum", "Reinforced Polymer", "Flameproof Aluminum"],
        "prefix": "SFT"
    },
    "Power Equipment": {
        "subcategories": ["Industrial Diesel Generator", "Online Double-Conversion UPS", "Solar Inverter Grid-Tied", "Battery Energy Storage Unit", "Automatic Transfer Switch"],
        "brands": ["Caterpillar", "Cummins", "Schneider Galaxy", "Vertiv Liebert", "SMA Solar", "Huawei Digital Power"],
        "voltages": ["400 V 3-Phase", "480 V", "11 kV", "230 V Single Phase", "400/230V 50Hz"],
        "powers": ["250 kVA", "500 kW", "1000 kVA", "100 kW", "50 kVA", "1200 kW", "1500 kVA"],
        "frequencies": ["50 Hz", "60 Hz", "50/60 Hz"],
        "rpms": ["1500 RPM", "1800 rpm", "N/A"],
        "ip_ratings": ["IP23", "IP54 Outdoor", "IP65 Enclosure", "IP20"],
        "materials": ["Galvanized Steel Weatherproof", "Acoustic Heavy Steel", "Marine Grade Aluminum"],
        "prefix": "PWR"
    }
}

SOURCES = ["Distributor Catalog EU", "OEM Technical Data Sheet", "ERP Master Data", "Supplier Price File 2024", "Vendor Portal Upload", "Field Engineering Audit"]
COUNTRIES = ["Germany", "United States", "Sweden", "Switzerland", "Japan", "Italy", "France", "United Kingdom", "China", "Finland"]
SUPPLIERS = ["Apex Industrial Supplies", "Global Electro Corp", "TechFlow Solutions", "Nordic Machinery Hub", "Continental Drive Systems", "Precision Parts Direct"]

def generate_catalog(num_rows=1050):
    products = []
    cat_keys = list(CATEGORIES.keys())
    
    # Pre-generate some base canonical products that will have duplicates & conflicts
    canonical_items = []
    for i in range(120):
        cat_name = cat_keys[i % len(cat_keys)]
        cat_info = CATEGORIES[cat_name]
        brand = random.choice(cat_info["brands"])
        subcat = random.choice(cat_info["subcategories"])
        model_num = f"{brand[:3].upper()}-{cat_info['prefix']}-{random.randint(100, 999)}"
        pname = f"{brand} {subcat} {model_num}"
        power = random.choice(cat_info["powers"])
        voltage = random.choice(cat_info["voltages"])
        canonical_items.append({
            "cat_name": cat_name,
            "subcat": subcat,
            "brand": brand,
            "model_num": model_num,
            "pname": pname,
            "power": power,
            "voltage": voltage,
            "price": round(random.uniform(150.0, 18500.0), 2)
        })

    row_count = 0
    while row_count < num_rows:
        row_id = f"PID-{10000 + row_count}"
        
        # 1. 10% intentional duplicates / variations of canonical items
        if row_count < 150 and canonical_items:
            base = canonical_items[row_count % len(canonical_items)]
            cat_name = base["cat_name"]
            cat_info = CATEGORIES[cat_name]
            
            # Vary naming slightly to create fuzzy duplicate
            name_variations = [
                base["pname"],
                base["pname"].upper(),
                f"{base['brand']} High Performance {base['subcat']} {base['model_num']}",
                f"{base['pname']} ({base['power']})",
                f"{base['brand']} {base['model_num']} - {base['subcat']}",
                f"{base['brand'].lower()} {base['subcat']} {base['model_num']}"
            ]
            pname = random.choice(name_variations)
            brand = base["brand"] if random.random() > 0.15 else base["brand"].lower()
            subcat = base["subcat"]
            model_num = base["model_num"] if random.random() > 0.1 else base["model_num"].replace("-", " ")
            
            # Conflict injection: some have conflicting power or voltage
            if random.random() < 0.35:
                power = random.choice(cat_info["powers"])
                voltage = random.choice(cat_info["voltages"])
            else:
                power = base["power"]
                voltage = base["voltage"]
                
            price = base["price"] if random.random() > 0.25 else round(base["price"] * random.uniform(0.9, 1.15), 2)
        else:
            cat_name = random.choice(cat_keys)
            cat_info = CATEGORIES[cat_name]
            brand = random.choice(cat_info["brands"])
            subcat = random.choice(cat_info["subcategories"])
            model_num = f"{brand[:3].upper()}-{cat_info['prefix']}-{random.randint(1000, 9999)}"
            pname = f"{brand} {subcat} {model_num}"
            power = random.choice(cat_info["powers"])
            voltage = random.choice(cat_info["voltages"])
            price = round(random.uniform(85.0, 24000.0), 2)
            
        freq = random.choice(cat_info["frequencies"])
        rpm = random.choice(cat_info["rpms"])
        ip = random.choice(cat_info["ip_ratings"])
        material = random.choice(cat_info["materials"])
        
        # Injected anomalies:
        # Missing values (5-10% rate for certain fields)
        if random.random() < 0.08:
            ip = ""
        if random.random() < 0.06:
            voltage = ""
        if random.random() < 0.07:
            power = ""
        if random.random() < 0.04:
            subcat = ""
        if random.random() < 0.03:
            price = "CONTACT SALES" if random.random() < 0.5 else ""
            
        # Malformed price or currency
        currency = random.choice(["USD", "EUR", "$", "€", "USD", "EUR", "GBP"]) if random.random() > 0.05 else ""
        
        # Dimensions & weights with varied units
        w_val = round(random.uniform(2.5, 450.0), 1)
        w_unit = random.choice(["kg", "KG", "kg.", "lbs", "LBS", "g", "kilograms"])
        weight = f"{w_val} {w_unit}" if random.random() > 0.05 else ""
        
        l, w, h = random.randint(100, 1200), random.randint(100, 800), random.randint(100, 900)
        dim_formats = [
            f"{l} x {w} x {h} mm",
            f"{l}x{w}x{h}mm",
            f"{round(l/10,1)}x{round(w/10,1)}x{round(h/10,1)} cm",
            f"{round(l/25.4,1)}\" x {round(w/25.4,1)}\" x {round(h/25.4,1)}\"",
            f"L:{l} W:{w} H:{h}"
        ]
        dimensions = random.choice(dim_formats) if random.random() > 0.08 else ""
        
        warranty_opts = ["12 Months", "2 Years", "24 months", "1 Year Standard", "36 Months Extended", "5 Years", ""]
        warranty = random.choice(warranty_opts)
        
        source = random.choice(SOURCES)
        country = random.choice(COUNTRIES)
        supplier = random.choice(SUPPLIERS)
        
        # Redundant or messy description
        descriptions = [
            f"Heavy-duty industrial grade {subcat or cat_name} engineered by {brand}. Designed for continuous continuous operation in harsh industrial environments with high thermal efficiency and rugged construction.",
            f"*** {brand.upper()} SPECIAL PROMO *** Model {model_num}. High reliability, certified quality. Suitable for power, water, oil&gas applications. Order now.",
            f"<div><p>Industrial {cat_name} - {model_num}</p><span>Manufacturer: {brand}</span><br>Standard spec with warranty: {warranty}</div>",
            f"{pname} offers industry leading performance, low vibration levels, and optimized lifecycle costs. Complies with ISO 9001 and CE directives.",
            f"REDUNDANT RECORD: {brand} {model_num} {cat_name} {subcat}. Contact supplier {supplier} for spec sheet.",
            f"Compact and durable {subcat or cat_name} with {power or 'standard power'} rating, rated for {voltage or 'multi-voltage'} networks."
        ]
        desc = random.choice(descriptions)
        
        tech_doc = f"https://docs.productiq-assets.com/specs/{brand.lower().replace(' ','_')}/{model_num.lower()}.pdf" if random.random() > 0.1 else ""
        prod_url = f"https://www.industrial-supply-direct.com/item/{model_num.lower()}" if random.random() > 0.08 else "invalid-url-item"
        
        products.append({
            "product_id": row_id,
            "product_name": pname,
            "brand": brand,
            "category": cat_name,
            "subcategory": subcat,
            "model_number": model_num,
            "description": desc,
            "price": price,
            "currency": currency,
            "voltage": voltage,
            "power": power,
            "frequency": freq,
            "rpm": rpm,
            "weight": weight,
            "dimensions": dimensions,
            "material": material,
            "ip_rating": ip,
            "warranty": warranty,
            "manufacturer": brand,
            "country": country,
            "supplier": supplier,
            "source": source,
            "technical_document": tech_doc,
            "product_url": prod_url
        })
        row_count += 1

    return products

def main():
    os.makedirs("data", exist_ok=True)
    products = generate_catalog(1050)
    
    csv_path = os.path.join("data", "sample_products_1000.csv")
    xlsx_path = os.path.join("data", "sample_products_1000.xlsx")
    
    fieldnames = list(products[0].keys())
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(products)
        
    df = pd.DataFrame(products)
    df.to_excel(xlsx_path, index=False, engine="openpyxl")
    print(f"Generated {len(products)} records in {csv_path} and {xlsx_path}")

if __name__ == "__main__":
    main()
