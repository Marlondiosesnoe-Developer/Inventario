// ── STATE ──────────────────────────────────────────────
let items = [];
let requests = [];
let editingId = null;

// Cargar datos de forma segura, protegiendo contra JSON corrupto
try {
  const savedItems = localStorage.getItem("inv_items");
  const savedRequests = localStorage.getItem("inv_requests");
  items = savedItems ? JSON.parse(savedItems) : [];
  requests = savedRequests ? JSON.parse(savedRequests) : [];
} catch (e) {
  console.error("Error al cargar datos del localStorage:", e);
  items = [];
  requests = [];
}

// ── NAVEGACIÓN ENTRE SECCIONES ────────────────────────
function showSection(sectionId) {
  // Ocultar todas las secciones
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Quitar clase active de todos los botones de navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostrar la sección seleccionada
  document.getElementById(sectionId).classList.add('active');
  
  // Marcar el botón correspondiente como activo
  document.querySelector(`.nav-btn[data-section="${sectionId}"]`).classList.add('active');
}

const CAT_MAP = {
  util: { label: "Útiles", cls: "badge-util" },
  office: { label: "Oficina", cls: "badge-office" },
  tech: { label: "Tecnología", cls: "badge-tech" },
  food: { label: "Alimentación", cls: "badge-food" },
  other: { label: "Otros", cls: "badge-other" },
};

// Definir campos dinámicos por categoría
const DYNAMIC_FIELDS = {
  util: [
    {
      id: "f-ink-color",
      label: "Color de tinta",
      type: "text",
      placeholder: "Ej: Azul, Negro, Rojo",
    },
    {
      id: "f-ink-type",
      label: "Tipo de tinta",
      type: "select",
      options: ["", "Gel", "Bolígrafo", "Fibra", "Marcador"],
    },
  ],
  tech: [
    {
      id: "f-model",
      label: "Modelo",
      type: "text",
      placeholder: "Ej: XPS 13, iPhone 15",
    },
    {
      id: "f-serial",
      label: "Número de serie",
      type: "text",
      placeholder: "Número de serie",
    },
  ],
  food: [
    { id: "f-expiry", label: "Fecha de vencimiento", type: "date" },
    {
      id: "f-weight",
      label: "Peso/Volumen",
      type: "text",
      placeholder: "Ej: 500g, 1L",
    },
  ],
  office: [
    {
      id: "f-size",
      label: "Tamaño",
      type: "text",
      placeholder: "Ej: A4, Oficio",
    },
    {
      id: "f-color",
      label: "Color",
      type: "text",
      placeholder: "Ej: Blanco, Negro",
    },
  ],
};

// ── SAVE ───────────────────────────────────────────────
function save() {
  localStorage.setItem("inv_items", JSON.stringify(items));
  localStorage.setItem("inv_requests", JSON.stringify(requests));
}

// ── ACTUALIZAR CAMPOS DINÁMICOS ────────────────────────
function updateDynamicFields() {
  const cat = document.getElementById("f-cat").value;
  const container = document.getElementById("dynamic-fields");
  const codeField = document.getElementById("field-code");
  const fields = DYNAMIC_FIELDS[cat];

  // Mostrar campo de código solo para categoría "Útiles"
  if (cat === "util") {
    codeField.style.display = "block";
  } else {
    codeField.style.display = "none";
  }

  if (!fields || fields.length === 0) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.style.display = "block";
  let html = `<h3>Detalles de ${CAT_MAP[cat].label}</h3><div class="form-grid-3">`;
  fields.forEach((field) => {
    if (field.type === "select") {
      html += `
        <div class="field">
          <label>${field.label}</label>
          <select id="${field.id}">
            ${field.options.map((opt) => `<option value="${opt}">${opt || "Seleccionar"}</option>`).join("")}
          </select>
        </div>`;
    } else {
      html += `
        <div class="field">
          <label>${field.label}</label>
          <input id="${field.id}" type="${field.type}" placeholder="${field.placeholder || ""}" />
        </div>`;
    }
  });
  html += "</div>";
  container.innerHTML = html;
}

// ── OBTENER VALORES DE CAMPOS DINÁMICOS ─────────────────
function getDynamicValues(cat) {
  const fields = DYNAMIC_FIELDS[cat];
  if (!fields) return {};
  const values = {};
  fields.forEach((field) => {
    const el = document.getElementById(field.id);
    if (el) {
      values[field.id] = el.value.trim();
    }
  });
  return values;
}

// ── FORMATEAR DETALLES PARA MOSTRAR ────────────────────
function formatDetails(item) {
  const parts = [];
  if (item.desc) parts.push(item.desc);
  if (item.code) parts.push(`Código: ${item.code}`);
  // Agregar campos dinámicos
  if (item.dynamic) {
    Object.entries(item.dynamic).forEach(([key, val]) => {
      if (val) {
        const field = Object.values(DYNAMIC_FIELDS)
          .flat()
          .find((f) => f.id === key);
        if (field) {
          parts.push(`${field.label}: ${val}`);
        }
      }
    });
  }
  return parts.length > 0 ? parts.join(" • ") : "—";
}

// ── HANDLE ROW CLICK ────────────────────────────────────
function handleRowClick(event, id) {
  // Evitar que el clic se propague al hacer clic en botones
  if (event.target.tagName === 'BUTTON') return;
  // Llamar a la función de editar
  editItem(id);
}

// ── EDIT ITEM ───────────────────────────────────────────
function editItem(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;

  // Cambiar a la sección de Ingresos
  showSection('ingresos');

  editingId = id;

  // Cargar datos en el formulario
  document.getElementById("f-name").value = item.name;
  document.getElementById("f-cat").value = item.cat;
  document.getElementById("f-status").value = item.status || "completo";
  document.getElementById("f-date").value = item.purchaseDate;
  document.getElementById("f-cost").value = item.cost;
  document.getElementById("f-qty").value = item.qty;
  document.getElementById("f-brand").value = item.brand || "";
  document.getElementById("f-supplier").value = item.supplier || "";
  document.getElementById("f-desc").value = item.desc || "";
  document.getElementById("f-code").value = item.code || "";

  // Actualizar campos dinámicos
  updateDynamicFields();

  // Cargar valores dinámicos
  if (item.dynamic) {
    Object.entries(item.dynamic).forEach(([key, value]) => {
      const el = document.getElementById(key);
      if (el) el.value = value;
    });
  }

  // Cambiar texto del botón
  document.querySelector(".btn-primary").textContent = "✅ Actualizar";

  // Scroll al formulario después de un pequeño delay para que se muestre la sección
  setTimeout(() => {
    document.querySelector(".add-section").scrollIntoView({ behavior: "smooth" });
  }, 100);
  
  showToast(`Editando: ${item.name}`);
}

// ── ADD/UPDATE ITEM ───────────────────────────────────
function addItem() {
  const name = document.getElementById("f-name").value.trim();
  const cat = document.getElementById("f-cat").value;
  const status = document.getElementById("f-status").value;
  const date =
    document.getElementById("f-date").value ||
    new Date().toISOString().slice(0, 10);
  const cost = parseFloat(document.getElementById("f-cost").value) || 0;
  const qty = parseInt(document.getElementById("f-qty").value) || 1;
  const desc = document.getElementById("f-desc").value.trim();
  const brand = document.getElementById("f-brand").value.trim();
  const supplier = document.getElementById("f-supplier").value.trim();
  const code = document.getElementById("f-code").value.trim();
  const dynamic = getDynamicValues(cat);

  if (!name) {
    showToast("⚠️ El nombre es obligatorio");
    return;
  }

  if (editingId) {
    // Modo actualización
    const index = items.findIndex((i) => i.id === editingId);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        name,
        cat,
        status,
        purchaseDate: date,
        cost,
        qty,
        desc,
        brand,
        supplier,
        code,
        dynamic,
      };
      showToast(`✅ "${name}" actualizado`);
    }
  } else {
    // Modo agregar
    items.push({
      id: Date.now(),
      name,
      cat,
      status,
      purchaseDate: date,
      cost,
      qty,
      desc,
      brand,
      supplier,
      code,
      dynamic,
      date: new Date().toISOString(),
    });
    showToast(`✅ "${name}" agregado`);
  }

  save();
  renderTable();
  updateStats();

  // Limpiar formulario y resetear estado
  editingId = null;
  document.getElementById("f-name").value = "";
  document.getElementById("f-cost").value = "";
  document.getElementById("f-qty").value = "1";
  document.getElementById("f-desc").value = "";
  document.getElementById("f-brand").value = "";
  document.getElementById("f-supplier").value = "";
  document.getElementById("f-code").value = "";
  document.getElementById("f-date").value = new Date()
    .toISOString()
    .slice(0, 10);
  document.querySelector(".btn-primary").textContent = "➕ Agregar";
  updateDynamicFields();
  document.getElementById("f-name").focus();
}

// ── DELETE ─────────────────────────────────────────────
function deleteItem(id) {
  const item = items.find((i) => i.id === id);
  items = items.filter((i) => i.id !== id);
  save();
  renderTable();
  updateStats();
  if (item) showToast(`🗑 "${item.name}" eliminado`);
}

// ── QTY CHANGE ─────────────────────────────────────────
function changeQty(id, delta) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  save();
  renderTable();
  updateStats();
}

// ── RENDER TABLE ───────────────────────────────────────
function renderTable() {
  const search = document.getElementById("search").value.toLowerCase();
  const catF = document.getElementById("filter-cat").value;
  const statusF = document.getElementById("filter-status").value;
  const sortF = document.getElementById("sort").value;

  let list = items.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search) ||
      (i.desc || "").toLowerCase().includes(search) ||
      (i.brand || "").toLowerCase().includes(search) ||
      (i.supplier || "").toLowerCase().includes(search);
    const matchCat = !catF || i.cat === catF;
    const matchStatus = !statusF || i.status === statusF;
    return matchSearch && matchCat && matchStatus;
  });

  list.sort((a, b) => {
    if (sortF === "date-desc") return new Date(b.date) - new Date(a.date);
    if (sortF === "date-asc") return new Date(a.date) - new Date(b.date);
    if (sortF === "cost-desc") return b.cost * b.qty - a.cost * a.qty;
    if (sortF === "cost-asc") return a.cost * a.qty - b.cost * b.qty;
    if (sortF === "name-asc") return a.name.localeCompare(b.name);
  });

  const tbody = document.getElementById("table-body");
  const empty = document.getElementById("empty-state");
  const totalBar = document.getElementById("total-bar");

  if (list.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    totalBar.style.display = "none";
    return;
  }

  empty.style.display = "none";
  totalBar.style.display = "flex";

  tbody.innerHTML = list
    .map((item) => {
      const cat = CAT_MAP[item.cat] || CAT_MAP.other;
      const sub = ((item.cost || 0) * (item.qty || 1)).toFixed(2);
      const cost = (item.cost || 0).toFixed(2);
      const purchaseDate = item.purchaseDate
        ? new Date(item.purchaseDate).toLocaleDateString("es-PE")
        : "—";
      const details = formatDetails(item);

      // Mapeo de estado a badge
      const STATUS_MAP = {
        completo: { label: "✓ Completo", cls: "badge-office" },
        medio: { label: "⚡ Medio", cls: "badge-tech" },
        reponer: { label: "⚠ Reponer", cls: "badge-food" },
      };
      const status = STATUS_MAP[item.status] || STATUS_MAP.completo;

      return `
      <tr style="cursor: pointer; transition: background-color 0.15s;" onclick="handleRowClick(event, ${item.id})">
        <td>
          <div class="item-name">${escHtml(item.name)}</div>
        </td>
        <td><span class="badge ${cat.cls}">${cat.label}</span></td>
        <td><span class="badge ${status.cls}">${status.label}</span></td>
        <td><span class="item-desc">${purchaseDate}</span></td>
        <td><span class="item-desc">${escHtml(item.brand || "—")}</span></td>
        <td><span class="item-desc">${escHtml(item.supplier || "—")}</span></td>
        <td><span class="item-desc">${escHtml(details)}</span></td>
        <td><span class="cost">S/ ${cost}</span></td>
        <td>
          <div class="qty-controls" onclick="event.stopPropagation()">
            <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
          </div>
        </td>
        <td><span class="cost">S/ ${sub}</span></td>
        <td onclick="event.stopPropagation()">
          <button class="btn btn-danger" onclick="deleteItem(${item.id})">Eliminar</button>
        </td>
      </tr>
    `;
    })
    .join("");

  // update total for filtered list
  const total = list.reduce(
    (acc, i) => acc + (i.cost || 0) * (i.qty || 1),
    0,
  );
  document.getElementById("total-cost").textContent =
    `S/ ${total.toFixed(2)}`;
}

// ── STATS ──────────────────────────────────────────────
function updateStats() {
  const totalItems = items.reduce((a, i) => a + (i.qty || 1), 0);
  const totalCost = items.reduce(
    (a, i) => a + (i.cost || 0) * (i.qty || 1),
    0,
  );
  const cats = new Set(items.map((i) => i.cat)).size;

  document.getElementById("stat-items").textContent = totalItems;
  document.getElementById("stat-cost").textContent =
    `S/ ${totalCost.toFixed(2)}`;
  document.getElementById("stat-cats").textContent = cats;
}

// ── CLEAR ALL ──────────────────────────────────────────
function clearAll() {
  if (!items.length) {
    showToast("El inventario ya está vacío");
    return;
  }
  if (confirm("¿Eliminar todos los ítems del inventario?")) {
    items = [];
    save();
    renderTable();
    updateStats();
    showToast("🗑 Inventario limpiado");
  }
}

// ── EXPORT EXCEL ───────────────────────────────────────
function exportExcel() {
  if (!items.length) {
    showToast("No hay ítems para exportar");
    return;
  }
  
  // Preparar los datos para Excel
  const data = items.map((i) => ({
    "Nombre": i.name,
    "Categoría": CAT_MAP[i.cat]?.label || i.cat,
    "Estado": i.status === "completo" ? "✅ Completo" : i.status === "medio" ? "⚡ Medio" : "⚠️ Reponer",
    "Fecha Compra": i.purchaseDate ? new Date(i.purchaseDate).toLocaleDateString("es-PE") : "",
    "Marca": i.brand || "",
    "Proveedor": i.supplier || "",
    "Código": i.code || "",
    "Detalles": formatDetails(i),
    "Costo Unitario (S/)": (i.cost || 0).toFixed(2),
    "Cantidad": i.qty || 1,
    "Subtotal (S/)": ((i.cost || 0) * (i.qty || 1)).toFixed(2),
    "Fecha Registro": new Date(i.date).toLocaleDateString("es-PE")
  }));
  
  // Crear libro y hoja de Excel
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
  
  // Descargar el archivo Excel
  XLSX.writeFile(workbook, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast("✅ Excel exportado");
}

// ── TOAST ──────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ── UTILS ──────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── ENTER KEY ─────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement.tagName === "INPUT")
    addItem();
});

// ── CHECK LOW STOCK ────────────────────────────────────
function checkLowStock() {
  const container = document.getElementById("alerts-container");
  const lowStockItems = items.filter(
    (item) => item.cat === "util" && item.qty <= (item.minStock || 5),
  );

  if (lowStockItems.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";
}

// ── CREATE REQUEST ─────────────────────────────────────
function createRequest(itemId) {
  const item = items.find((i) => i.id === itemId);
  if (!item) return;

  // Solicitar 5 unidades adicionales (valor predeterminado)
  const qtyNeeded = 5;
  requests.push({
    id: Date.now(),
    itemId: item.id,
    itemName: item.name,
    qty: qtyNeeded,
    status: "pending",
    date: new Date().toISOString(),
  });

  save();
  renderRequests();
  showToast(`✅ Solicitud creada para ${item.name}`);
}

// ── RENDER REQUESTS ───────────────────────────────────
function renderRequests() {
  const container = document.getElementById("requests-container");

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 30px 20px;">
        <p>No hay solicitudes de pedido.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = requests
    .map(
      (req) => `
        <div class="request-item ${req.status}">
          <div>
            <div style="font-weight: 500;">${escHtml(req.itemName)}</div>
            <div style="font-size: 0.78rem; color: var(--muted);">
              Cantidad: ${req.qty} | 
              ${new Date(req.date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge ${req.status === "completed" ? "badge-office" : "badge-tech"}" style="font-size: 0.72rem;">
              ${req.status === "completed" ? "✅ Completado" : "⏳ Pendiente"}
            </span>
            ${
              req.status === "pending"
                ? `
              <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.75rem;" onclick="completeRequest(${req.id})">
                ✔️ Marcar
              </button>
            `
                : ""
            }
            <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.75rem;" onclick="deleteRequest(${req.id})">
              🗑️
            </button>
          </div>
        </div>
      `,
    )
    .join("");
}

// ── COMPLETE REQUEST ──────────────────────────────────
function completeRequest(id) {
  const req = requests.find((r) => r.id === id);
  if (!req) return;

  req.status = "completed";
  save();
  renderRequests();
  showToast(`✅ Solicitud completada`);
}

// ── DELETE REQUEST ───────────────────────────────────
function deleteRequest(id) {
  if (confirm("¿Eliminar esta solicitud?")) {
    requests = requests.filter((r) => r.id !== id);
    save();
    renderRequests();
    showToast("🗑️ Solicitud eliminada");
  }
}

// ── OVERRIDE RENDER TABLE TO SHOW STOCK STATUS ───────
const originalRenderTable = renderTable;
renderTable = function () {
  originalRenderTable();
  checkLowStock();
};

// ── INIT ──────────────────────────────────────────────
document.getElementById("f-date").value = new Date()
  .toISOString()
  .slice(0, 10);
updateDynamicFields();
renderTable();
updateStats();
renderRequests();
