let aktualniDatum = new Date();

document.addEventListener('DOMContentLoaded', () => {
    console.log("Stránka boss byla načtena, volám funkci pro načítání dat...");
    aktualizujAktualniMesic();
    nactiStatistiky();
    nactiObjekty();
});

function aktualizujAktualniMesic() {
    const mesicRok = aktualniDatum.toLocaleString('cs-CZ', { year: 'numeric', month: 'long' });
    document.getElementById('aktualniMesic').textContent = mesicRok;
}

function zmenitMesic(smer) {
    aktualniDatum.setMonth(aktualniDatum.getMonth() + smer);
    aktualizujAktualniMesic();
    nactiStatistiky();
    nactiMesicniPrehled();
}

function nactiStatistiky() {
    const mesic = aktualniDatum.getMonth() + 1; // Měsíce jsou v Date od 0 do 11, takže přičítáme 1
    const rok = aktualniDatum.getFullYear();

    fetch(`/boss/data?mesic=${mesic}&rok=${rok}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Chyba při načítání dat:", data.error);
                return;
            }

            const ctx = document.getElementById('grafVycerpaniCas').getContext('2d');
            const labels = data.map(objekt => objekt.nazev);
            const fondHodin = data.map(objekt => objekt.fond_hodin);
            const vycerpaneHodiny = data.map(objekt => objekt.vycerpane_hodiny);

            if (window.grafVycerpaniCas && typeof window.grafVycerpaniCas.destroy === 'function') {
                window.grafVycerpaniCas.destroy();
            }

            window.grafVycerpaniCas = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Fond hodin',
                            data: fondHodin,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)'
                        },
                        {
                            label: 'Vyčerpané hodiny',
                            data: vycerpaneHodiny,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error("Chyba při načítání dat pro graf:", error);
        });
}

function nactiMesicniPrehled() {
    const mesic = aktualniDatum.getMonth() + 1;
    const rok = aktualniDatum.getFullYear();

    fetch(`/boss/mesicni-prehled?mesic=${mesic}&rok=${rok}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('mesicniPrehledTbody');
            tbody.innerHTML = "";
            data.forEach(zaznam => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border py-2 px-4">${zaznam.uzivatel}</td>
                    <td class="border py-2 px-4">${zaznam.objekt}</td>
                    <td class="border py-2 px-4">${zaznam.cas}</td>
                    <td class="border py-2 px-4">${zaznam.popis}</td>
                    <td class="border py-2 px-4">${zaznam.datum}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error("Chyba při načítání měsíčního přehledu:", error));
}

function nactiObjekty() {
    fetch('/admin/objekty')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('objektSelect');
            select.innerHTML = '<option value="" disabled selected>Vyberte objekt</option>';
            data.forEach(objekt => {
                const option = document.createElement('option');
                option.value = objekt.id;
                option.textContent = objekt.nazev;
                select.appendChild(option);
            });
        })
        .catch(error => console.error("Chyba při načítání objektů:", error));
}

function zobrazAktivityObjektu() {
    const objektId = document.getElementById('objektSelect').value;
    if (!objektId) {
        console.error("Musíte vybrat objekt!");
        return;
    }

    const mesic = aktualniDatum.getMonth() + 1;
    const rok = aktualniDatum.getFullYear();

    fetch(`/boss/aktivity-objektu?objekt_id=${objektId}&mesic=${mesic}&rok=${rok}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('detailAktivityTbody');
            tbody.innerHTML = "";
            data.forEach(zaznam => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border py-2 px-4">${zaznam.uzivatel}</td>
                    <td class="border py-2 px-4">${zaznam.cas}</td>
                    <td class="border py-2 px-4">${zaznam.popis}</td>
                    <td class="border py-2 px-4">${zaznam.datum}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error("Chyba při načítání aktivit objektu:", error));
}

function tiskVsechAktivit(divId) {
    const originalContent = document.body.innerHTML;
    const printContent = document.getElementById(divId).innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
}
