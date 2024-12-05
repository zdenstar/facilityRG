from flask import Blueprint, request, jsonify, send_file
import sqlite3
import os

boss_bp = Blueprint('boss', __name__)

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

# Endpoint pro zobrazení stránky boss
@boss_bp.route("/", methods=["GET"])
def zobraz_boss_stranku():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "boss.html"))
    except Exception as e:
        print(f"Chyba při načítání stránky boss: {e}")
        return "Chyba při načítání stránky boss", 500

# Endpoint pro načtení dat pro statistiky (grafy)
@boss_bp.route("/data", methods=["GET"])
def nacti_data():
    mesic = request.args.get("mesic", type=int)
    rok = request.args.get("rok", type=int)

    if not mesic or not rok:
        return jsonify({"error": "Měsíc a rok jsou povinné"}), 400

    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Načtení vyčerpání času na všech objektech pro zvolený měsíc a rok
            cursor.execute("""
                SELECT o.nazev, o.fond_hodin, IFNULL(SUM(z.cas), 0) AS vycerpane_hodiny
                FROM objekty o
                LEFT JOIN zaznamy z ON z.objekt_id = o.id AND strftime('%m', z.datum) = ? AND strftime('%Y', z.datum) = ?
                GROUP BY o.id, o.nazev, o.fond_hodin
            """, (f"{mesic:02}", str(rok)))
            objekty = cursor.fetchall()

            return jsonify([{
                "nazev": o[0],
                "fond_hodin": o[1],
                "vycerpane_hodiny": o[2]
            } for o in objekty])
    except sqlite3.Error as e:
        print(f"Chyba při načítání dat pro statistiky: {e}")
        return jsonify({"error": "Chyba při načítání dat"}), 500

# Endpoint pro načtení měsíčního přehledu všech aktivit
@boss_bp.route("/mesicni-prehled", methods=["GET"])
def nacti_mesicni_prehled():
    mesic = request.args.get("mesic", type=int)
    rok = request.args.get("rok", type=int)

    if not mesic or not rok:
        return jsonify({"error": "Měsíc a rok jsou povinné"}), 400

    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Načtení všech záznamů pro zvolený měsíc a rok
            cursor.execute("""
                SELECT u.jmeno, o.nazev, z.cas, z.popis, z.datum
                FROM zaznamy z
                JOIN uzivatele u ON z.uzivatel_id = u.id
                JOIN objekty o ON z.objekt_id = o.id
                WHERE strftime('%m', z.datum) = ? AND strftime('%Y', z.datum) = ?
            """, (f"{mesic:02}", str(rok)))
            zaznamy = cursor.fetchall()

            return jsonify([{
                "uzivatel": z[0],
                "objekt": z[1],
                "cas": z[2],
                "popis": z[3],
                "datum": z[4]
            } for z in zaznamy])
    except sqlite3.Error as e:
        print(f"Chyba při načítání měsíčního přehledu: {e}")
        return jsonify({"error": "Chyba při načítání měsíčního přehledu"}), 500

# Endpoint pro načtení detailních aktivit pro konkrétní objekt
@boss_bp.route("/aktivity-objektu", methods=["GET"])
def nacti_aktivity_objektu():
    objekt_id = request.args.get("objekt_id", type=int)
    mesic = request.args.get("mesic", type=int)
    rok = request.args.get("rok", type=int)

    if not objekt_id or not mesic or not rok:
        return jsonify({"error": "ID objektu, měsíc a rok jsou povinné"}), 400

    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Načtení všech aktivit pro konkrétní objekt, měsíc a rok
            cursor.execute("""
                SELECT u.jmeno, z.cas, z.popis, z.datum
                FROM zaznamy z
                JOIN uzivatele u ON z.uzivatel_id = u.id
                WHERE z.objekt_id = ? AND strftime('%m', z.datum) = ? AND strftime('%Y', z.datum) = ?
            """, (objekt_id, f"{mesic:02}", str(rok)))
            zaznamy = cursor.fetchall()

            return jsonify([{
                "uzivatel": z[0],
                "cas": z[1],
                "popis": z[2],
                "datum": z[3]
            } for z in zaznamy])
    except sqlite3.Error as e:
        print(f"Chyba při načítání aktivit objektu: {e}")
        return jsonify({"error": "Chyba při načítání aktivit objektu"}), 500

# Endpoint pro poskytnutí JavaScriptového souboru boss.js
@boss_bp.route("/boss.js", methods=["GET"])
def poskytnout_boss_js():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "boss.js"))
    except Exception as e:
        print(f"Chyba při načítání souboru boss.js: {e}")
        return "Chyba při načítání souboru boss.js", 500
