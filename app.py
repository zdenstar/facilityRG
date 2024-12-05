from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import os
from expert import expert_bp  # Import našeho nového blueprintu
from zadavani import zadavani_bp  # Import našeho nového blueprintu
from boss import boss_bp  # Import blueprintu pro boss stránku

app = Flask(__name__)
CORS(app)

# Registrace blueprintu pro expert editaci
app.register_blueprint(expert_bp, url_prefix="/expert")


# Registrace blueprintu pro zadávání
app.register_blueprint(zadavani_bp, url_prefix="/zadavani")

app.register_blueprint(boss_bp, url_prefix="/boss")  # Registrace blueprintu boss_bp


# Cesta k databázi a ke složce s HTML soubory
DB_PATH = os.path.join(os.path.dirname(__file__), "vykaz_cinnosti.db")

# Funkce pro připojení k databázi
def get_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        return conn
    except sqlite3.Error as e:
        print(f"Chyba při připojování k databázi: {e}")
        return None

# Inicializace databáze
def init_db():
    with get_db() as conn:
        if conn is None:
            print("Nelze se připojit k databázi.")
            return
        cursor = conn.cursor()
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS uzivatele (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    jmeno TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS objekty (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nazev TEXT NOT NULL,
                    fond_hodin INTEGER NOT NULL DEFAULT 0
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS prirazeni (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uzivatel_id INTEGER NOT NULL,
                    objekt_id INTEGER NOT NULL,
                    FOREIGN KEY (uzivatel_id) REFERENCES uzivatele (id),
                    FOREIGN KEY (objekt_id) REFERENCES objekty (id)
                )
            """)
            conn.commit()
        except sqlite3.Error as e:
            print(f"Chyba při vytváření tabulek: {e}")

# Endpoint pro zobrazení expertEdit stránky
@app.route("/expertEdit", methods=["GET"])
def zobraz_expert_edit_stranku():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "expertEdit.html"))
    except Exception as e:
        return "Chyba při načítání stránky expertEdit", 500

# Endpoint pro poskytování `expertEdit.js` přímo ze složky
@app.route("/expertEdit.js", methods=["GET"])
def poskytnout_expert_edit_js():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "expertEdit.js"))
    except Exception as e:
        return "Chyba při načítání souboru expertEdit.js", 500

# Endpoint pro načtení všech uživatelů
@app.route("/admin/uzivatele", methods=["GET"])
def nacti_uzivatele():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM uzivatele")
            uzivatele = cursor.fetchall()
            return jsonify([{"id": u[0], "jmeno": u[1]} for u in uzivatele])
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při načítání uživatelů"}), 500

# Endpoint pro přidání nového uživatele
@app.route("/admin/uzivatele", methods=["POST"])
def pridat_uzivatele():
    data = request.get_json()
    jmeno = data.get("jmeno")
    if not jmeno:
        return jsonify({"error": "Jméno uživatele je povinné"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO uzivatele (jmeno) VALUES (?)", (jmeno,))
            conn.commit()
        return jsonify({"status": "Uživatel přidán"}), 201
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při přidávání uživatele"}), 500

# Endpoint pro smazání uživatele
@app.route("/admin/uzivatele/<int:uzivatel_id>", methods=["DELETE"])
def smazat_uzivatele(uzivatel_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM uzivatele WHERE id = ?", (uzivatel_id,))
            cursor.execute("DELETE FROM prirazeni WHERE uzivatel_id = ?", (uzivatel_id,))
            conn.commit()
        return jsonify({"status": "Uživatel smazán"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při mazání uživatele"}), 500

# Endpoint pro načtení všech objektů
@app.route("/admin/objekty", methods=["GET"])
def nacti_objekty():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM objekty")
            objekty = cursor.fetchall()
            return jsonify([{"id": o[0], "nazev": o[1], "fond_hodin": o[2]} for o in objekty])
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při načítání objektů"}), 500

# Endpoint pro přidání nového objektu
@app.route("/admin/objekty", methods=["POST"])
def pridat_objekt():
    data = request.get_json()
    nazev = data.get("nazev")
    fond_hodin = data.get("fond_hodin", 0)
    if not nazev:
        return jsonify({"error": "Název objektu je povinný"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO objekty (nazev, fond_hodin) VALUES (?, ?)", (nazev, fond_hodin))
            conn.commit()
        return jsonify({"status": "Objekt přidán"}), 201
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při přidávání objektu"}), 500

# Endpoint pro úpravu fondu hodin objektu
@app.route("/admin/objekty/<int:objekt_id>", methods=["PUT"])
def upravit_fond_hodin(objekt_id):
    data = request.get_json()
    fond_hodin = data.get("fond_hodin")
    if fond_hodin is None:
        return jsonify({"error": "Fond hodin je povinný"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE objekty SET fond_hodin = ? WHERE id = ?", (fond_hodin, objekt_id))
            conn.commit()
        return jsonify({"status": "Fond hodin upraven"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při úprave fondu hodin"}), 500

# Endpoint pro smazání objektu
@app.route("/admin/objekty/<int:objekt_id>", methods=["DELETE"])
def smazat_objekt(objekt_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM objekty WHERE id = ?", (objekt_id,))
            cursor.execute("DELETE FROM prirazeni WHERE objekt_id = ?", (objekt_id,))
            conn.commit()
        return jsonify({"status": "Objekt smazán"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při mazání objektu"}), 500

# Endpoint pro přiřazení objektu uživateli
@app.route("/admin/prirazeni", methods=["POST"])
def priradit_objekt():
    data = request.get_json()
    uzivatel_id = data.get("uzivatel_id")
    objekt_id = data.get("objekt_id")
    if not uzivatel_id or not objekt_id:
        return jsonify({"error": "ID uživatele a ID objektu jsou povinné"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO prirazeni (uzivatel_id, objekt_id) VALUES (?, ?)", (uzivatel_id, objekt_id))
            conn.commit()
        return jsonify({"status": "Objekt přiřazen uživateli"}), 201
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při přiřazování objektu"}), 500

# Endpoint pro načtení všech přiřazení objektů uživatelům
@app.route("/admin/prirazeni", methods=["GET"])
def nacti_prirazeni():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.uzivatel_id, u.jmeno, p.objekt_id, o.nazev
                FROM prirazeni p
                JOIN uzivatele u ON p.uzivatel_id = u.id
                JOIN objekty o ON p.objekt_id = o.id
            """)
            prirazeni = cursor.fetchall()
            return jsonify([{"uzivatel_id": p[0], "uzivatel_jmeno": p[1], "objekt_id": p[2], "objekt_nazev": p[3]} for p in prirazeni])
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při načítání přiřazení"}), 500

# Endpoint pro odebrání přiřazeného objektu
@app.route("/admin/prirazeni", methods=["DELETE"])
def odebrat_prirazeni():
    data = request.get_json()
    uzivatel_id = data.get("uzivatel_id")
    objekt_id = data.get("objekt_id")
    if not uzivatel_id or not objekt_id:
        return jsonify({"error": "ID uživatele a ID objektu jsou povinné"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM prirazeni WHERE uzivatel_id = ? AND objekt_id = ?", (uzivatel_id, objekt_id))
            conn.commit()
        return jsonify({"status": "Přiřazení objektu odebráno"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při odebírání přiřazení"}), 500

# Endpoint pro zobrazení administrativní stránky
@app.route("/admin", methods=["GET"])
def zobraz_admin_stranku():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "admin.html"))
    except Exception as e:
        return "Chyba při načítání stránky administrace", 500

# Endpoint pro poskytování `admin.js` přímo ze složky
@app.route("/admin.js", methods=["GET"])
def poskytnout_admin_js():
    try:
        return send_file(os.path.join(os.path.dirname(__file__), "admin.js"))
    except Exception as e:
        return "Chyba při načítání souboru admin.js", 500


@app.route("/admin/uzivatele/<int:uzivatel_id>", methods=["PUT"])
def upravit_uzivatele(uzivatel_id):
    data = request.get_json()
    jmeno = data.get("jmeno")
    if not jmeno:
        return jsonify({"error": "Jméno je povinné"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE uzivatele SET jmeno = ? WHERE id = ?", (jmeno, uzivatel_id))
            conn.commit()
        return jsonify({"status": "Uživatel upraven"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při úpravě uživatele"}), 500

@app.route("/admin/objekty/<int:objekt_id>", methods=["PUT"])
def upravit_objekt(objekt_id):
    data = request.get_json()
    nazev = data.get("nazev")
    fond_hodin = data.get("fond_hodin")
    if not nazev or fond_hodin is None:
        return jsonify({"error": "Název a fond hodin jsou povinné"}), 400
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE objekty SET nazev = ?, fond_hodin = ? WHERE id = ?", (nazev, fond_hodin, objekt_id))
            conn.commit()
        return jsonify({"status": "Objekt upraven"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": "Chyba při úpravě objektu"}), 500










# Inicializace databáze při spuštění aplikace
if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000, threaded=True)
