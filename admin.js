document.addEventListener('DOMContentLoaded', () => {
    nactiUzivatele();
    nactiObjekty();
    nactiPrirazeni();
});

// Vytvoření notifikace
function vytvorNotifikaci(zprava, barva) {
    const notifikace = document.createElement('div');
    notifikace.className = `p-3 mb-4 text-white rounded ${barva}`;
    notifikace.textContent = zprava;

    const notifikaceKontejner = document.getElementById('notifikaceKontejner');
    if (notifikaceKontejner) {
        notifikaceKontejner.appendChild(notifikace);
        setTimeout(() => {
            notifikace.remove();
        }, 3000);
    }
}

// Funkce pro přidání uživatele
function pridatUzivatele() {
    const jmeno = document.getElementById('novyUzivatel').value;
    if (!jmeno) {
        vytvorNotifikaci('Zadejte jméno uživatele!', 'bg-red-500');
        return;
    }
    fetch('/admin/uzivatele', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jmeno }),
    })
        .then(response => response.json())
        .then(() => {
            vytvorNotifikaci('Uživatel úspěšně přidán!', 'bg-green-500');
            document.getElementById('novyUzivatel').value = ''; // Vymazání formuláře
            nactiUzivatele();
        })
        .catch(error => vytvorNotifikaci('Chyba při přidávání uživatele: ' + error.message, 'bg-red-500'));
}

// Funkce pro načtení uživatelů
function nactiUzivatele() {
    fetch('/admin/uzivatele')
        .then(response => response.json())
        .then(data => {
            const uzivateleSeznam = document.getElementById('uzivateleSeznam');
            uzivateleSeznam.innerHTML = '';
            data.forEach(({ id, jmeno }) => {
                const listItem = document.createElement('li');
                listItem.className = 'flex items-center justify-between';
                listItem.innerHTML = `
                    <span>${jmeno}</span>
                    <div class="flex space-x-2">
                        <button onclick="smazatUzivatele(${id})" class="bg-red-500 text-white p-1 rounded hover:bg-red-600">Smazat</button>
                        <button onclick="zobrazPrirazeniModal(${id})" class="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600">Přiřadit objekt</button>
                    </div>
                `;
                uzivateleSeznam.appendChild(listItem);
            });
        })
        .catch(error => vytvorNotifikaci('Chyba při načítání uživatelů: ' + error.message, 'bg-red-500'));
}

// Funkce pro přidání objektu
function pridatObjekt() {
    const nazev = document.getElementById('novyObjekt').value;
    const fondHodin = parseInt(document.getElementById('fondHodin').value) || 0;
    if (!nazev) {
        vytvorNotifikaci('Zadejte název objektu!', 'bg-red-500');
        return;
    }
    fetch('/admin/objekty', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nazev, fond_hodin: fondHodin }),
    })
        .then(response => response.json())
        .then(() => {
            vytvorNotifikaci('Objekt úspěšně přidán!', 'bg-green-500');
            document.getElementById('novyObjekt').value = ''; // Vymazání formuláře
            document.getElementById('fondHodin').value = ''; // Vymazání formuláře
            nactiObjekty();
        })
        .catch(error => vytvorNotifikaci('Chyba při přidávání objektu: ' + error.message, 'bg-red-500'));
}

// Funkce pro načtení objektů
function nactiObjekty() {
    fetch('/admin/objekty')
        .then(response => response.json())
        .then(data => {
            const objektySeznam = document.getElementById('objektySeznam');
            if (objektySeznam) {
                objektySeznam.innerHTML = '';
            }
            const objektSelect = document.getElementById('objektSelect');
            if (objektSelect) {
                objektSelect.innerHTML = '';
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                defaultOption.textContent = 'Vyberte objekt';
                objektSelect.appendChild(defaultOption);
            }

            data.forEach(({ id, nazev, fond_hodin }) => {
                if (objektySeznam) {
                    const listItem = document.createElement('li');
                    listItem.className = 'flex items-center justify-between';
                    listItem.innerHTML = `
                        <span>${nazev} (Fond hodin: ${fond_hodin})</span>
                        <div class="flex space-x-2">
                            <button onclick="smazatObjekt(${id})" class="bg-red-500 text-white p-1 rounded hover:bg-red-600">Smazat</button>
                            <button onclick="upravitFondHodin(${id})" class="bg-blue-500 text-white p-1 rounded hover:bg-blue-600">Upravit fond hodin</button>
                        </div>
                    `;
                    objektySeznam.appendChild(listItem);
                }

                if (objektSelect) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = nazev;
                    objektSelect.appendChild(option);
                }
            });
        })
        .catch(error => vytvorNotifikaci('Chyba při načítání objektů: ' + error.message, 'bg-red-500'));
}

// Funkce pro úpravu fondu hodin
function upravitFondHodin(id) {
    const novyFondHodin = prompt('Zadejte nový fond hodin:');
    if (novyFondHodin === null || novyFondHodin === '') {
        vytvorNotifikaci('Fond hodin nebyl zadán!', 'bg-red-500');
        return;
    }
    fetch(`/admin/objekty/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fond_hodin: parseInt(novyFondHodin) }),
    })
        .then(response => {
            if (!response.ok) throw new Error('Chyba při úpravě fondu hodin');
            vytvorNotifikaci('Fond hodin úspěšně upraven!', 'bg-green-500');
            nactiObjekty();
        })
        .catch(error => vytvorNotifikaci('Chyba při úpravě fondu hodin: ' + error.message, 'bg-red-500'));
}

// Funkce pro přiřazení objektu uživateli
function zobrazPrirazeniModal(uzivatelId) {
    const objektSelect = document.getElementById('objektSelect');
    if (!objektSelect) {
        vytvorNotifikaci('Objektový seznam nebyl nalezen!', 'bg-red-500');
        return;
    }
    const vybranyObjektId = objektSelect.value;
    if (!vybranyObjektId) {
        vytvorNotifikaci('Musíte vybrat objekt!', 'bg-red-500');
        return;
    }
    priraditObjekt(uzivatelId, parseInt(vybranyObjektId));
}

// Funkce pro přiřazení objektu uživateli
function priraditObjekt(uzivatelId, objektId) {
    fetch('/admin/prirazeni', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uzivatel_id: uzivatelId, objekt_id: objektId }),
    })
        .then(response => {
            if (!response.ok) throw new Error('Chyba při přiřazování objektu uživateli');
            vytvorNotifikaci('Objekt úspěšně přiřazen uživateli!', 'bg-green-500');
            nactiPrirazeni();
        })
        .catch(error => vytvorNotifikaci('Chyba při přiřazování objektu uživateli: ' + error.message, 'bg-red-500'));
}

// Funkce pro načtení přiřazených objektů uživatelům
function nactiPrirazeni() {
    fetch('/admin/prirazeni')
        .then(response => response.json())
        .then(data => {
            const prirazeniSeznam = document.getElementById('prirazeniSeznam');
            prirazeniSeznam.innerHTML = '';
            data.forEach(({ uzivatel_id, uzivatel_jmeno, objekt_id, objekt_nazev }) => {
                const listItem = document.createElement('li');
                listItem.className = 'flex items-center justify-between';
                listItem.innerHTML = `
                    <span>${uzivatel_jmeno} - ${objekt_nazev}</span>
                    <button onclick="odebratPrirazeni(${uzivatel_id}, ${objekt_id})" class="bg-red-500 text-white p-1 rounded hover:bg-red-600">Odebrat</button>
                `;
                prirazeniSeznam.appendChild(listItem);
            });
        })
        .catch(error => vytvorNotifikaci('Chyba při načítání přiřazení: ' + error.message, 'bg-red-500'));
}

// Funkce pro odebrání přiřazení objektu uživateli
function odebratPrirazeni(uzivatelId, objektId) {
    fetch('/admin/prirazeni', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uzivatel_id: uzivatelId, objekt_id: objektId }),
    })
        .then(response => {
            if (!response.ok) throw new Error('Chyba při odebírání přiřazení');
            vytvorNotifikaci('Přiřazení úspěšně odebráno!', 'bg-green-500');
            nactiPrirazeni();
        })
        .catch(error => vytvorNotifikaci('Chyba při odebírání přiřazení: ' + error.message, 'bg-red-500'));
}
