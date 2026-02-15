// ===============================
// SELETORES
// ===============================
const themeToggle = document.getElementById("themeToggle");
const form = document.getElementById("Form");
const transactionList = document.getElementById("transactionList");
let chart;

// ===============================
// FUNÇÃO PARA LIMPAR DADOS (ANTI-NaN)
// ===============================
function getCleanData() {
    const data = JSON.parse(localStorage.getItem("transactions")) || [];
    return data
        .filter(t => !isNaN(t.valor) && t.valor !== null)
        .map(t => ({
            ...t,
            date: new Date(t.date)
        }));
}

let transactions = getCleanData();

// ===============================
// TEMA
// ===============================
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    document.body.classList.toggle("dark-mode");
    themeToggle.textContent =
        document.body.classList.contains("light-mode")
            ? "🌙 Modo Dark"
            : "☀️ Modo Light";
});

// ===============================
// NAVEGAÇÃO
// ===============================
window.showSection = (id) => {
    document.querySelectorAll(".content-section").forEach(s => s.style.display = "none");
    document.getElementById(`section-${id}`).style.display = "block";
};

window.scrollToTransactions = () => {
    showSection("dashboard");
    document.getElementById("area-transacoes").scrollIntoView({ behavior: "smooth" });
};

// ===============================
// ADICIONAR TRANSAÇÃO
// ===============================
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const valor = parseFloat(document.getElementById("valor").value);

    if (isNaN(valor) || valor <= 0) {
        alert("Digite um valor válido.");
        return;
    }

    const newTransaction = {
        id: Date.now(),
        valor: valor,
        categoria: document.getElementById("categoria").value,
        tipo: document.getElementById("tipo").value,
        date: new Date()
    };

    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    form.reset();
    updateApp();
});

// ===============================
// ATUALIZA TUDO
// ===============================
function updateApp() {

    const filtered = applyFilters();

    const inc = transactions
        .filter(t => t.tipo === "receita")
        .reduce((acc, t) => acc + t.valor, 0);

    const exp = transactions
        .filter(t => t.tipo === "despesa")
        .reduce((acc, t) => acc + t.valor, 0);

    document.getElementById("income").textContent = `R$ ${inc.toFixed(2)}`;
    document.getElementById("expense").textContent = `R$ ${exp.toFixed(2)}`;
    document.getElementById("balance").textContent = `R$ ${(inc - exp).toFixed(2)}`;

    renderList(filtered);
    renderChart(inc, exp);
}

// ===============================
// FILTROS
// ===============================
function applyFilters() {
    const month = document.getElementById("filterMonth").value;
    const cat = document.getElementById("filterCategory").value;

    return transactions.filter(t => {

        const matchMonth =
            month === "all" ||
            new Date(t.date).getMonth() == month;

        const matchCat =
            cat === "all" ||
            t.categoria === cat;

        return matchMonth && matchCat;
    });
}

// ===============================
// RENDERIZA LISTA + BOTÃO EXCLUIR
// ===============================
function renderList(data) {

    transactionList.innerHTML = "";

    if (data.length === 0) {
        transactionList.innerHTML = "<p style='color:gray'>Nenhum dado para este filtro.</p>";
        return;
    }

    [...data].reverse().forEach(t => {

        const div = document.createElement("div");
        div.className = "transaction-item";

        div.innerHTML = `
            <div>
                <strong>${t.categoria.toUpperCase()}</strong><br>
                <small>${new Date(t.date).toLocaleDateString()}</small>
            </div>

            <div style="display:flex; align-items:center; gap:10px;">
                <span style="color: ${t.tipo === 'receita' ? 'var(--green)' : 'var(--red)'}">
                    ${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
                </span>
                <button onclick="deleteTransaction(${t.id})"
                    style="background:var(--red); border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">
                    🗑
                </button>
            </div>
        `;

        transactionList.appendChild(div);
    });
}

// ===============================
// FUNÇÃO EXCLUIR
// ===============================
window.deleteTransaction = function(id) {

    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateApp();
};

// ===============================
// GRÁFICO FUNCIONANDO
// ===============================
function renderChart(inc, exp) {

    const ctx = document.getElementById("financeChart").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Receitas", "Despesas"],
            datasets: [{
                data: [inc, exp],
                backgroundColor: ["#22c55e", "#ef4444"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: window.innerWidth < 600 ? "bottom" : "right",
                    labels: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue("--text")
                    }
                }
            }
        }
    });
}

// ===============================
// EVENTOS FILTRO
// ===============================
document.getElementById("filterMonth").addEventListener("change", updateApp);
document.getElementById("filterCategory").addEventListener("change", updateApp);

// ===============================
// INICIALIZAÇÃO
// ===============================
updateApp();
