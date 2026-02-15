// ===============================
// SELETORES GERAIS
// ===============================
const themeToggle = document.getElementById("themeToggle");
const form = document.getElementById("Form");
const transactionList = document.getElementById("transactionList");
let chart;

// ===============================
// GESTÃO DE DADOS (LIMPEZA ANTI-NaN)
// ===============================
function getCleanData() {
    const data = JSON.parse(localStorage.getItem("transactions")) || [];
    // Filtra apenas valores válidos para evitar o erro NaN no gráfico/saldo
    return data
        .filter(t => !isNaN(t.valor) && t.valor !== null)
        .map(t => ({
            ...t,
            date: new Date(t.date)
        }));
}

let transactions = getCleanData();

// ===============================
// TEMA (DARK / LIGHT)
// ===============================
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    document.body.classList.toggle("dark-mode");
    
    // Altera o texto do botão conforme o tema
    themeToggle.textContent = document.body.classList.contains("light-mode") 
        ? "🌙 Modo Dark" 
        : "☀️ Modo Light";
    
    // Atualiza o gráfico para adaptar a cor da legenda
    updateApp();
});

// ===============================
// NAVEGAÇÃO E SCROLL
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
// ADICIONAR NOVA TRANSAÇÃO
// ===============================
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const valorInput = document.getElementById("valor").value;
    const valor = parseFloat(valorInput);

    // Validação simples
    if (isNaN(valor) || valor <= 0) {
        alert("Por favor, digite um valor maior que zero.");
        return;
    }

    const newTransaction = {
        id: Date.now(), // Gera ID único baseado no tempo
        valor: valor,
        categoria: document.getElementById("categoria").value,
        tipo: document.getElementById("tipo").value,
        date: new Date()
    };

    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    form.reset();
    updateApp(); // Recalcula tudo
});

// ===============================
// FUNÇÃO EXCLUIR TRANSAÇÃO
// ===============================
window.deleteTransaction = function(id) {
    // Mantém apenas as transações que NÃO têm o ID clicado
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateApp();
};

// ===============================
// ATUALIZAÇÃO DA INTERFACE (Saldos e Gráfico)
// ===============================
function updateApp() {
    const filtered = applyFilters();

    // Cálculo das Receitas
    const inc = transactions
        .filter(t => t.tipo === "receita")
        .reduce((acc, t) => acc + t.valor, 0);

    // Cálculo das Despesas
    const exp = transactions
        .filter(t => t.tipo === "despesa")
        .reduce((acc, t) => acc + t.valor, 0);

    // Atualiza os Cards de Valor
    document.getElementById("income").textContent = `R$ ${inc.toFixed(2)}`;
    document.getElementById("expense").textContent = `R$ ${exp.toFixed(2)}`;
    document.getElementById("balance").textContent = `R$ ${(inc - exp).toFixed(2)}`;

    renderList(filtered);
    renderChart(inc, exp);
}

// ===============================
// LÓGICA DE FILTROS
// ===============================
function applyFilters() {
    const month = document.getElementById("filterMonth").value;
    const cat = document.getElementById("filterCategory").value;

    return transactions.filter(t => {
        const matchMonth = month === "all" || new Date(t.date).getMonth() == month;
        const matchCat = cat === "all" || t.categoria === cat;
        return matchMonth && matchCat;
    });
}

// ===============================
// RENDERIZAÇÃO DA LISTA NO HTML
// ===============================
function renderList(data) {
    transactionList.innerHTML = "";

    if (data.length === 0) {
        transactionList.innerHTML = "<p style='color:gray; padding:10px'>Nenhum registro encontrado.</p>";
        return;
    }

    // .reverse() para mostrar a mais recente primeiro
    [...data].reverse().forEach(t => {
        const div = document.createElement("div");
        div.className = "transaction-item";

        div.innerHTML = `
            <div>
                <strong>${t.categoria.toUpperCase()}</strong><br>
                <small>${new Date(t.date).toLocaleDateString('pt-BR')}</small>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="color: ${t.tipo === 'receita' ? 'var(--green)' : 'var(--red)'}; font-weight:bold">
                    ${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
                </span>
                <button onclick="deleteTransaction(${t.id})" 
                        style="background:none; border:none; cursor:pointer; font-size:1.1rem;" title="Excluir">
                    🗑️
                </button>
            </div>
        `;
        transactionList.appendChild(div);
    });
}

// ===============================
// RENDERIZAÇÃO DO GRÁFICO (CHART.JS)
// ===============================
function renderChart(inc, exp) {
    const canvas = document.getElementById("financeChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Se o gráfico já existir, destrói para criar um novo (evita sobreposição)
    if (chart) chart.destroy();

    // Se não houver dados, não desenha o gráfico
    if (inc === 0 && exp === 0) return;

    // Pega a cor do texto atual do CSS para a legenda
    const textColor = getComputedStyle(document.body).getPropertyValue("--text");

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Receitas", "Despesas"],
            datasets: [{
                data: [inc, exp],
                backgroundColor: ["#22c55e", "#ef4444"],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: window.innerWidth < 600 ? "bottom" : "right",
                    labels: { color: textColor, font: { size: 14 } }
                }
            }
        }
    });
}

// ===============================
// ESCUTADORES DE EVENTOS DOS FILTROS
// ===============================
document.getElementById("filterMonth").addEventListener("change", updateApp);
document.getElementById("filterCategory").addEventListener("change", updateApp);

// ===============================
// INICIALIZAÇÃO AO CARREGAR
// ===============================
updateApp();