document.addEventListener('DOMContentLoaded', () => {
    console.log("Stránka expertEdit byla načtena, volám funkce pro načítání dat...");
    nactiUzivatele();
    nactiObjekty();
    nactiZaznamy();
});

// Funkce pro načtení uživatelů
function nactiUzivatele() {
    console.log("Načítám uživatele...");
    fetch('/admin/uzivatele')
        .then(response => response.json())
        .then(data => {
            const uzivateleTbody = document.getElementById('uzivateleTbody');
            uzivateleTbody.innerHTML = '';

            data.forEach(({ id, jmeno }) => {
                const row = document.createElement('tr');
                row.className = 'border-t border-gray-300';
                row.innerHTML = `
                    <td class="border p-2">${id}</td>
                    <td class="border p-2"><input type="text" value="${jmeno}" class="border p-1 w-full" id="jmeno-${id}"></td>
                    <td class="border p-2">
                        <button onclick="ulozitUzivatele(${id})" class="bg-green-500 text-white p-1 rounded hover:bg-green-600">Uložit</button>
                        <button onclick="smazatUzivatele(${id})" class="bg-red-500 text-white p-1 rounded hover:bg-red-600">Smazat</button>
                    </td>
                `;
                uzivateleTbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Chyba při načítání uživatelů:", error);
        });
}

// Funkce pro načtení objektů
function nactiObjekty() {
    console.log("Načítám objekty...");
    fetch('/admin/objekty')
        .then(response => response.json())
        .then(data => {
            const objektyTbody = document.getElementById('objektyTbody');
            objektyTbody.innerHTML = '';

            data.forEach(({ id, nazev, fond_hodin }) => {
                const row = document.createElement('tr');
                row.className = 'border-t border-gray-300';
                row.innerHTML = `
                    <td class="border p-2">${id}</td>
                    <td class="border p-2"><input type="text" value="${nazev}" class="border p-1 w-full" id="nazev-${id}"></td>
                    <td class="border p-2"><input type="number" value="${fond_hodin}" class="border p-1 w-full" id="fondHodin-${id}"></td>
                    <td class="border p-2">
                        <button onclick="ulozitObjekt(${id})" class="bg-green-500 text-white p-1 rounded hover:bg-green-600">Uložit</button>
                        <button onclick="smazatObjekt(${id})" class="bg-red-500 text-white p-1 rounded hover:bg-red-600">Smazat</button>
                    </td>
                `;
                objektyTbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Chyba při načítání objektů:", error);
        });
}

// Funkce pro načtení záznamů
function nactiZaznamy() {
    console.log("Načítám záznamy...");
    fetch('/expert/zaznamy')
        .then(response => response.json())
        .then(data => {
            const zaznamyTbody = document.getElementById('zaznamyTbody');
            zaznamyTbody.innerHTML = '';

            data.forEach(({ id, uzivatel_jmeno, objekt_nazev, cas, popis }) => {
                const row = document.createElement('tr');
                row.className = 'border-t border-gray-300';
                row.innerHTML = `
                    <td class="border p-2">${id}</td>
                    <td class="border p-2">${uzivatel_jmeno}</td>
                    <td class="border p-2">${objekt_nazev}</td>
                    <td class="border p-2"><input type="number" value="${cas}" class="border p-1 w-full" id="cas-${id}"></td>
                    <td class="border p-2"><input type="text" value="${popis}" class="border p-1 w-full" id="popis-${id}"></td>
                    <td class="border p-2">
                        <button onclick="ulozitZaznam(${id})" class="bg-green-500 text-white p-1 rounded hover:bg-green-600">Uložit</button>
                    </td>
                `;
                zaznamyTbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Chyba při načítání záznamů:", error);
        });
}

// Funkce pro uložení změn uživatele
function ulozitUzivatele(id) {
    const jmeno = document.getElementById(`jmeno-${id}`).value;
    fetch(`/admin/uzivatele/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jmeno }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Chyba při ukládání uživatele:", data.error);
            } else {
                console.log("Uživatel uložen:", data);
                nactiUzivatele(); // Obnovení seznamu
            }
        })
        .catch(error => {
            console.error("Chyba při ukládání uživatele:", error);
        });
}

// Funkce pro uložení změn objektu
function ulozitObjekt(id) {
    const nazev = document.getElementById(`nazev-${id}`).value;
    const fond_hodin = document.getElementById(`fondHodin-${id}`).value;
    fetch(`/admin/objekty/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nazev, fond_hodin }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Chyba při ukládání objektu:", data.error);
            } else {
                console.log("Objekt uložen:", data);
                nactiObjekty(); // Obnovení seznamu
            }
        })
        .catch(error => {
            console.error("Chyba při ukládání objektu:", error);
        });
}

// Funkce pro uložení změn záznamu
function ulozitZaznam(id) {
    const cas = document.getElementById(`cas-${id}`).value;
    const popis = document.getElementById(`popis-${id}`).value;
    fetch(`/expert/zaznamy/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cas, popis }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Chyba při ukládání záznamu:", data.error);
            } else {
                console.log("Záznam uložen:", data);
                nactiZaznamy(); // Obnovení seznamu
            }
        })
        .catch(error => {
            console.error("Chyba při ukládání záznamu:", error);
        });
}
