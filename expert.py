from flask import Blueprint, request, jsonify
import sqlite3
import os

expert_bp = Blueprint('expert', __name__)

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


@expert_bp.route("/zaznamy/<int:zaznam_id>", methods=["PUT"])
def upravit_zaznam(zaznam_id):
    data = request.get_json()
    cas = data.get("cas")
    popis = data.get("popis")
    if cas is None or not popis:
        return jsonify({"error": "Čas a popis jsou povinné"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE zaznamy SET cas = ?, popis = ? WHERE id = ?", (cas, popis, zaznam_id))
            conn.commit()
        return jsonify({"status": "Záznam upraven"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při úpravě záznamu"}), 500


# Endpoint pro načtení všech záznamů
@expert_bp.route("/zaznamy", methods=["GET"])
def nacti_zaznamy():
    try:
        with get_db() as conn:
            if conn is None:
                print("Chyba: Nelze se připojit k databázi.")
                return jsonify({"error": "Chyba při připojení k databázi"}), 500

            cursor = conn.cursor()
            # Debugovací výpis pro kontrolu existence tabulky
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='zaznamy'")
            tabulka_existuje = cursor.fetchone()
            if tabulka_existuje is None:
                print("Chyba: Tabulka 'zaznamy' neexistuje.")
                return jsonify([])  # Pokud tabulka neexistuje, vracíme prázdné pole

            # Výpis pro kontrolu obsahu tabulky
            cursor.execute("SELECT COUNT(*) FROM zaznamy")
            pocet_zaznamu = cursor.fetchone()[0]
            print(f"Počet záznamů v tabulce 'zaznamy': {pocet_zaznamu}")

            # Výběr záznamů
            cursor.execute("""
                SELECT z.id, u.jmeno, o.nazev, z.cas, z.popis
                FROM zaznamy z
                JOIN uzivatele u ON z.uzivatel_id = u.id
                JOIN objekty o ON z.objekt_id = o.id
            """)
            zaznamy = cursor.fetchall()

            # Debugovací výpis pro záznamy
            if not zaznamy:
                print("Chyba: Žádné záznamy nebyly nalezeny.")
            else:
                print("Načtené záznamy:", zaznamy)
            
            return jsonify([{"id": z[0], "uzivatel_jmeno": z[1], "objekt_nazev": z[2], "cas": z[3], "popis": z[4]} for z in zaznamy])
    except sqlite3.Error as e:
        print(f"Chyba při načítání záznamů: {e}")
        return jsonify({"error": "Chyba při načítání záznamů"}), 500
