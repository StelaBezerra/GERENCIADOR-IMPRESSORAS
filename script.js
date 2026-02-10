
//Para aparecer suas informações no site, coloque as no campo abaixo. 
//OBS: Para cada loja é necessário uma linha igual a que ta dentro da "const data"
const data = [
  { modelo:"--", toner:"--", loja:"Coloque suas informações no JS para aparecer aqui", setor:"--", serie:"--", ip:"--", status:"--", senha:"--", marca:"--" },
];



const $ = (sel) => document.querySelector(sel);
const uniq = (arr) => [...new Set(arr)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'));
const escapeCsv = (v) => `"${String(v ?? "").replaceAll('"','""')}"`;

let sortKey = "modelo";
let sortDir = "asc";
let showPasswords = false;
let readyToShow = false;

function setEnabled(el, enabled){
  if(!el) return; 
  el.disabled = !enabled;
}


function fillFilters(){
  const selLoja = document.getElementById("fLoja");
  console.log("fLoja encontrado?", selLoja);

  if(!selLoja){
    alert("Não achei #fLoja. Você está abrindo outro index.html ou o script roda antes do HTML.");
    return;
  }

  const lojas = uniq(data.map(d=>d.loja));
  for(const v of lojas) selLoja.add(new Option(v, v));

  setEnabled($("#fSetor"), false);
  setEnabled($("#fMarca"), false);
  setEnabled($("#q"), false);
  setEnabled($("#btnCsv"), false);
  setEnabled($("#btnPrint"), false);
  setEnabled($("#btnTogglePwd"), false);
}


function statusBadge(status){
  if(!status) return `<span class="badge badge--empty">—</span>`;
  const s = String(status).trim().toUpperCase();
  if(s === "OK") return `<span class="badge badge--ok">OK</span>`;
  return `<span class="badge">${status}</span>`;
}

function copy(text, btn){
  navigator.clipboard?.writeText(text ?? "");

  if(btn){
    const old = btn.textContent;
    btn.textContent = "✔";
    btn.style.background = "#4CAF50";
    btn.style.color = "#fff";

    setTimeout(()=>{
      btn.textContent = old;
      btn.style.background = "";
      btn.style.color = "";
    },1000);
  }
}


function render(rows){
  const tb = document.querySelector("#tbl tbody");
  tb.innerHTML = "";

  for(const d of rows){
    const tr = document.createElement("tr");
    const senhaMasked = d.senha ? "••••••••" : "—";
    const senhaCell = showPasswords ? (d.senha || "—") : senhaMasked;

    tr.innerHTML = `
      <td>${d.modelo || "—"}</td>
      <td>${d.toner || "—"}</td>
      <td>${d.loja || "—"}</td>
      <td>${d.setor || "—"}</td>
      <td class="muted">${d.serie || "—"}</td>
      <td class="muted">${d.ip || "—"}</td>
      <td>${statusBadge(d.status)}</td>
      <td class="pwd">${senhaCell}</td>
      <td>${d.marca || "—"}</td>
      <td>
        <div class="actions">
          <button class="btnMini" data-action="ip" title="Copiar IP">IP</button>
          <button class="btnMini" data-action="serie" title="Copiar Série">Série</button>
          <button class="btnMini" data-action="eye" title="Mostrar/ocultar senhas">👁</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-action="ip"]').onclick = (e) => copy(d.ip, e.target);
    tr.querySelector('[data-action="serie"]').onclick = () => copy(d.serie);
    tr.querySelector('[data-action="eye"]').onclick = () => { showPasswords = !showPasswords; applyFilters(); };

    tb.appendChild(tr);
  }


  document.querySelectorAll('th[data-k] .sort').forEach(s => s.textContent = "");
  const thSort = document.querySelector(`th[data-k="${sortKey}"] .sort`);
  if(thSort) thSort.textContent = (sortDir === "asc" ? "▲" : "▼");
}


function getFilteredRows(){
  if(!readyToShow) return [];

  const loja = $("#fLoja").value;
  const marca = $("#fMarca").value;
  const q = $("#q").value.trim().toLowerCase();

  let rows = data.filter(d =>
    d.loja === loja &&
    (!marca || d.marca === marca)
  );

  if(q){
    rows = rows.filter(d => {
      const blob = [
        d.modelo, d.toner, d.serie, d.ip, d.status, d.senha, d.marca, d.setor
      ].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }


  
  rows.sort((a,b)=>{
    const av = (a[sortKey] ?? "").toString();
    const bv = (b[sortKey] ?? "").toString();
    const cmp = av.localeCompare(bv,'pt-BR',{numeric:true,sensitivity:"base"});
    return sortDir === "asc" ? cmp : -cmp;
  });

  return rows;
}


function applyFilters(){
  const rows = getFilteredRows();
  render(rows);

  if(!readyToShow){
    
    return;
  }

  $("#count").textContent = `Mostrando ${rows.length} registros (${ $("#fLoja").value })`;

}

function exportXlsx(){
  const rows = getFilteredRows();

  if(!rows.length){
    alert("Não há dados para exportar. Selecione uma Loja.");
    return;
  }

  const sheetData = rows.map(d => ({
    "Mod. Impressora": d.modelo || "",
    "Toner": d.toner || "",
    "Loja": d.loja || "",
    "Setor": d.setor || "",
    "Nº série": d.serie || "",
    "IP": d.ip || "",
    "Status": d.status || "",
    "Senha": d.senha || "",
    "Marca": d.marca || ""
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetData);

  ws["!cols"] = [
    { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 22 },
    { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 14 }, { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Impressoras");

  const loja = $("#fLoja").value || "LOJA";
  const safe = (s) => String(s).replace(/[\\/:*?"<>|]+/g, "-").trim();

  XLSX.writeFile(wb, `impressoras_${safe(loja)}.xlsx`);
}



function initSort(){
  document.querySelectorAll("th[data-k]").forEach(th=>{
    th.addEventListener("click", ()=>{
      if(!readyToShow) return;
      const k = th.dataset.k;
      if(sortKey === k) sortDir = (sortDir === "asc" ? "desc" : "asc");
      else { sortKey = k; sortDir = "asc"; }
      applyFilters();
    });
  });
}



 

  $("#fMarca").addEventListener("change", applyFilters);
  $("#q").addEventListener("input", applyFilters);

  $("#btnCsv").addEventListener("click", exportXlsx);
  $("#btnPrint").addEventListener("click", () => window.print());
  $("#btnTogglePwd").addEventListener("click", () => {
    showPasswords = !showPasswords;
    applyFilters();
  });

  function updateStepControls(){
  const loja = $("#fLoja").value;

  if(!loja){
    readyToShow = false;

    setEnabled($("#fMarca"), false);
    setEnabled($("#q"), false);
    setEnabled($("#btnCsv"), false);
    setEnabled($("#btnPrint"), false);
    setEnabled($("#btnTogglePwd"), false);

    $("#count").textContent = "Selecione uma loja para começar";
    render([]);
    return;
  }

  readyToShow = true;

  setEnabled($("#fMarca"), true);
  setEnabled($("#q"), true);
  setEnabled($("#btnCsv"), true);
  setEnabled($("#btnPrint"), true);
  setEnabled($("#btnTogglePwd"), true);

  applyFilters();
}


  function initEvents(){
  $("#fLoja").addEventListener("change", () => {
    $("#fMarca").value = "";
    $("#q").value = "";
    updateStepControls();
  });

  $("#fMarca").addEventListener("change", applyFilters);
  $("#q").addEventListener("input", applyFilters);

  $("#btnCsv").addEventListener("click", exportXlsx);
  $("#btnPrint").addEventListener("click", () => window.print());
  $("#btnTogglePwd").addEventListener("click", () => {
    showPasswords = !showPasswords;
    applyFilters();
  });
}

 window.addEventListener("DOMContentLoaded", () => {
  fillFilters();
  initEvents();
  initSort();
  updateStepControls();

  console.log("JS OK - lojas carregadas:", document.getElementById("fLoja")?.options?.length);
});

