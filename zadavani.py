from flask import Blueprint, request, jsonify, send_file
import sqlite3
import os
from datetime import datetime

zadavani_bp = Blueprint('zadavani', __name__)

# Cesta k databázi
DB_PATH = os.path.join(os.path.dirname(__file__), "vykaz_cinnosti.db")

# Funkce pro připojení k databázi
def get_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        return conn
    except sqlite3.Error as e:
        print(f"Chyba při připojování k databázi: {e}")
        return None

# Endpoint pro zobrazení stránky zadávání
@zadavani_bp.route("/", methods=["GET"])
def zobraz_zadavani_stranku():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "zadavani.html"))
    except Exception as e:
        print(f"Chyba při načítání stránky zadávání: {e}")
        return "Chyba při načítání stránky zadávání", 500

# Endpoint pro uložení činnosti
@zadavani_bp.route("/", methods=["POST"])
def ulozit_cinnost():
    data = request.get_json()
    uzivatel_id = data.get("uzivatel_id")
    objekt_id = data.get("objekt_id")
    cas = data.get("cas")
    popis = data.get("popis")
    datum = datetime.now().date()

    if not uzivatel_id or not objekt_id or not cas or not popis:
        return jsonify({"error": "Všechny pole jsou povinné"}), 400

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO zaznamy (uzivatel_id, objekt_id, cas, popis, datum)
                VALUES (?, ?, ?, ?, ?)
            """, (uzivatel_id, objekt_id, cas, popis, datum))
            conn.commit()
        return jsonify({"status": "Činnost uložena"}), 201
    except sqlite3.Error as e:
        print(f"Chyba při ukládání činnosti: {e}")
        return jsonify({"error": "Chyba při ukládání činnosti"}), 500

# Endpoint pro načtení uživatele a přiřazených objektů, včetně hodin
@zadavani_bp.route("/data/<int:uzivatel_id>", methods=["GET"])
def nacti_data_pro_uzivatele(uzivatel_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Načtení informací o uživateli
            cursor.execute("SELECT jmeno FROM uzivatele WHERE id = ?", (uzivatel_id,))
            uzivatel = cursor.fetchone()

            if not uzivatel:
                return jsonify({"error": "Uživatel nenalezen"}), 404

            # Načtení přiřazených objektů a informací o fondech hodin a vyčerpaných hodinách
            cursor.execute("""
                SELECT o.id, o.nazev, o.fond_hodin,
                       IFNULL(SUM(z.cas), 0) AS vycerpane_hodiny
                FROM prirazeni p
                JOIN objekty o ON p.objekt_id = o.id
                LEFT JOIN zaznamy z ON z.objekt_id = o.id AND z.uzivatel_id = p.uzivatel_id
                WHERE p.uzivatel_id = ?
                GROUP BY o.id, o.nazev, o.fond_hodin
            """, (uzivatel_id,))
            objekty = cursor.fetchall()

            return jsonify({
                "uzivatel": {"id": uzivatel_id, "jmeno": uzivatel[0]},
                "objekty": [{"id": o[0], "nazev": o[1], "fond_hodin": o[2], "vycerpane_hodiny": o[3]} for o in objekty]
            })
    except sqlite3.Error as e:
        print(f"Chyba při načítání dat pro uživatele: {e}")
        return jsonify({"error": "Chyba při načítání dat"}), 500

# Endpoint pro poskytování JavaScriptového souboru zadavani.js
@zadavani_bp.route("/zadavani.js", methods=["GET"])
def poskytnout_zadavani_js():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "zadavani.js"))
    except Exception as e:
        print(f"Chyba při načítání souboru zadavani.js: {e}")
        return "Chyba při načítání souboru zadavani.js", 500
