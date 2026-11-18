const adminApi = "/api/admin";
const loginForm = document.getElementById("loginForm");
const accessKey = document.getElementById("accessKey");
const feedback = document.getElementById("feedback");
const dashboard = document.getElementById("dashboard");
const logout = document.getElementById("logout");
const reload = document.getElementById("reload");
const programmeList = document.getElementById("programmeList");
const emptyList = document.getElementById("emptyList");
const programmeForm = document.getElementById("programmeForm");
const fields = programmeForm.elements;
const editorTitle = document.getElementById("editorTitle");
const resetEditor = document.getElementById("resetEditor");
const deleteProgramme = document.getElementById("deleteProgramme");
const saveProgramme = document.getElementById("saveProgramme");
const editorFeedback = document.getElementById("editorFeedback");

let programmes = [];
let editing = null;

const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric",
});
const stationDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit",
});

function report(message = "", failed = false, target = feedback) {
  target.textContent = message;
  target.dataset.error = String(failed);
}

function showDashboard(authenticated) {
  loginForm.hidden = authenticated;
  dashboard.hidden = !authenticated;
  logout.hidden = !authenticated;
}

async function request(path, method = "GET", data) {
  const response = await fetch(adminApi + path, {
    method,
    cache: "no-store",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const cause = new Error(payload.error || "Não foi possível concluir o pedido.");
    cause.status = response.status;
    throw cause;
  }
  return payload;
}

function updateSaveLabel() {
  if (fields.namedItem("published").checked) {
    saveProgramme.textContent = editing?.published ? "Guardar alterações" : "Publicar programa";
  } else {
    saveProgramme.textContent = "Guardar rascunho";
  }
}

function editProgramme(programme = null) {
  editing = programme;
  programmeForm.reset();
  report("", false, editorFeedback);
  editorTitle.textContent = programme ? "Editar programa" : "Novo programa";
  resetEditor.hidden = !programme;
  deleteProgramme.hidden = !programme;
  if (programme) {
    for (const name of ["title", "host", "description", "starts_on", "starts_at", "duration_minutes"]) {
      fields.namedItem(name).value = programme[name];
    }
    fields.namedItem("weekly").value = String(Boolean(programme.weekly));
    fields.namedItem("published").checked = Boolean(programme.published);
  } else {
    fields.namedItem("starts_on").value = stationDate.format(new Date());
  }
  updateSaveLabel();
}

function renderList() {
  programmes.sort((a, b) => (a.starts_on + a.starts_at).localeCompare(b.starts_on + b.starts_at)
    || a.title.localeCompare(b.title, "pt-PT"));
  const rows = programmes.map((programme) => {
    const item = document.createElement("li");
    item.className = "programme-item";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.className = "programme-name";
    title.textContent = programme.title;
    const details = document.createElement("p");
    details.className = "programme-details";
    const date = dateFormat.format(new Date(programme.starts_on + "T00:00Z"));
    details.textContent = [
      date + " · " + programme.starts_at,
      programme.weekly ? "Semanal" : "",
      programme.host,
      programme.published ? "Publicado" : "Rascunho",
    ].filter(Boolean).join(" · ");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.textContent = "Editar";
    button.setAttribute("aria-label", "Editar " + programme.title);
    button.addEventListener("click", () => {
      editProgramme(programme);
      fields.namedItem("title").focus();
      report();
    });
    content.append(title, details);
    item.append(content, button);
    return item;
  });
  programmeList.replaceChildren(...rows);
  emptyList.hidden = rows.length > 0;
}

async function loadProgrammes() {
  const data = await request("/programas");
  programmes = data.programmes;
  renderList();
  showDashboard(true);
}

function handleError(cause, target = feedback) {
  if (cause.status === 401) {
    showDashboard(false);
    accessKey.focus();
    target = feedback;
  }
  report(cause.message, true, target);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = loginForm.querySelector("button");
  submit.disabled = true;
  try {
    await request("/session", "POST", { key: accessKey.value.trim() });
    loginForm.reset();
    await loadProgrammes();
    report();
    fields.namedItem("title").focus();
  } catch (cause) {
    handleError(cause);
  } finally {
    submit.disabled = false;
  }
});

logout.addEventListener("click", async () => {
  setSaving(true);
  try {
    await request("/session", "DELETE");
    programmes = [];
    renderList();
    editProgramme();
    showDashboard(false);
    report("Sessão terminada.");
    accessKey.focus();
  } catch (cause) {
    handleError(cause);
  } finally {
    setSaving(false);
  }
});

reload.addEventListener("click", async () => {
  setSaving(true);
  try {
    await loadProgrammes();
    report("Lista atualizada.");
  } catch (cause) {
    handleError(cause);
  } finally {
    setSaving(false);
  }
});

function setSaving(saving) {
  for (const control of [...fields, reload, logout, ...programmeList.querySelectorAll("button")]) {
    control.disabled = saving;
  }
}

programmeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(programmeForm));
  data.duration_minutes = Number(data.duration_minutes);
  data.weekly = data.weekly === "true";
  data.published = fields.namedItem("published").checked;
  if (editing) data.revision = editing.revision;
  setSaving(true);
  try {
    const { programme } = await request(editing ? "/programas/" + editing.id : "/programas", editing ? "PUT" : "POST", data);
    programmes = [...programmes.filter((item) => item.id !== programme.id), programme];
    renderList();
    editProgramme(programme);
    report(programme.published ? "Programa publicado na grelha." : "Rascunho guardado.", false, editorFeedback);
  } catch (cause) {
    handleError(cause, editorFeedback);
  } finally {
    setSaving(false);
  }
});

deleteProgramme.addEventListener("click", async () => {
  if (!editing || !window.confirm("Apagar «" + editing.title + "»?")) return;
  setSaving(true);
  try {
    const { programme } = await request("/programas/" + editing.id, "DELETE", { revision: editing.revision });
    programmes = programmes.filter((item) => item.id !== programme.id);
    renderList();
    editProgramme();
    report("Programa apagado.", false, editorFeedback);
  } catch (cause) {
    handleError(cause, editorFeedback);
  } finally {
    setSaving(false);
  }
});

fields.namedItem("published").addEventListener("change", updateSaveLabel);
resetEditor.addEventListener("click", () => {
  editProgramme();
  report();
  fields.namedItem("title").focus();
});

editProgramme();
loadProgrammes().then(() => report()).catch((cause) => {
  if (cause.status === 401) {
    showDashboard(false);
    report();
  } else {
    report(cause.message, true);
  }
});
