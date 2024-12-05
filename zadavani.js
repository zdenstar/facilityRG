document.addEventListener('DOMContentLoaded', () => {
    console.log("Stránka zadávání byla načtena, volám funkci pro načítání dat...");
    const params = new URLSearchParams(window.location.search);
    const uzivatelId = params.get('uzivatel_id');

    if (!uzivatelId) {
        alert("Chybí ID uživatele v URL!");
        return;
    }

    nactiDataProUzivatele(uzivatelId);
});

function nactiDataProUzivatele(uzivatelId) {
    fetch(`/zadavani/data/${uzivatelId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Chyba při načítání dat:", data.error);
                return;
            }

            // Nastavení jména uživatele
            const uzivatelJmeno = data.uzivatel.jmeno;
            document.getElementById('uzivatelJmeno').textContent = `Uživatel: ${uzivatelJmeno}`;

            // Načtení přiřazených objektů do selectu
            const objektSelect = document.getElementById('objektSelect');
            objektSelect.innerHTML = '<option value="" disabled selected>Vyberte objekt</option>';
            data.objekty.forEach(({ id, nazev }) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = nazev;
                objektSelect.appendChild(option);
            });

            // Načtení informací o fondech hodin a zobrazení v tabulce
            const hodinySeznam = document.getElementById('hodinySeznam');
            hodinySeznam.innerHTML = '';
            data.objekty.forEach(({ id, nazev, fond_hodin, vycerpane_hodiny }) => {
                const zbyvaHodin = fond_hodin - vycerpane_hodiny;
                const procentVycerpano = fond_hodin > 0 ? ((vycerpane_hodiny / fond_hodin) * 100).toFixed(2) : 0;

                const listItem = document.createElement('tr');
                listItem.innerHTML = `
                    <td class="p-2 border">${nazev}</td>
                    <td class="p-2 border">${fond_hodin}</td>
                    <td class="p-2 border">${vycerpane_hodiny}</td>
                    <td class="p-2 border">${zbyvaHodin}</td>
                    <td class="p-2 border">${procentVycerpano}%</td>
                `;
                hodinySeznam.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error("Chyba při načítání dat pro uživatele:", error);
        });
}

function ulozitCinnost() {
    console.log("Funkce ulozitCinnost byla zavolána.");

    const params = new URLSearchParams(window.location.search);
    const uzivatelId = params.get('uzivatel_id');

    if (!uzivatelId) {
        alert("Chybí ID uživatele v URL!");
        return;
    }

    const objektId = document.getElementById('objektSelect').value;
    const cas = document.getElementById('cas').value;
    const popis = document.getElementById('popis').value;

    if (!objektId || !cas || !popis) {
        vytvorNotifikaci("Všechny pole jsou povinné!", 'bg-red-500');
        return;
    }

    fetch('/zadavani', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uzivatel_id: uzivatelId, objekt_id: objektId, cas, popis }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            vytvorNotifikaci("Chyba při ukládání činnosti: " + data.error, 'bg-red-500');
        } else {
            vytvorNotifikaci("Činnost úspěšně uložena!", 'bg-green-500');
            document.getElementById('zadavaniForm').reset();
            nactiDataProUzivatele(uzivatelId); // Načtení aktualizovaných dat
        }
    })
    .catch(error => {
        vytvorNotifikaci("Chyba při ukládání činnosti: " + error.message, 'bg-red-500');
    });
}

// Definice funkce pro vytváření notifikací
function vytvorNotifikaci(zprava, barva) {
    const notifikace = document.createElement('div');
    notifikace.className = `p-3 mb-4 text-white rounded ${barva}`;
    notifikace.textContent = zprava;

    const notifikaceKontejner = document.getElementById('notifikaceKontejner');
    notifikaceKontejner.appendChild(notifikace);
    setTimeout(() => {
        notifikace.remove();
    }, 3000);
}
