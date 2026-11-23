(() => {
  "use strict";
  if (document.getElementById("extras-catalogo")) return;
  const recurso = new URL("./", document.currentScript.src);
  const base = new URL("../", recurso);
  const clave = "catalogo-extras:" + base.pathname;
  const leer = (sufijo, defecto) => {
    try { return JSON.parse(localStorage.getItem(clave + sufijo)) ?? defecto; }
    catch { return defecto; }
  };
  function guardar(sufijo, contenido) {
    try { localStorage.setItem(clave + sufijo, JSON.stringify(contenido)); return true; }
    catch { return false; }
  }
  const origen = window.CATALOGO_PERSONALIZADO?.productos ??
    (typeof plantas !== "undefined" ? plantas : typeof productos !== "undefined" ? productos : []);
  const inventario = origen.flatMap((producto, indice) => {
    const item = { id: String(indice), nombre: producto.nombre, precio: producto.precio ?? null,
      imagen: producto.imagen ? producto.imagen.replace(/^\.\//, "") : "",
      clase: producto.id && typeof plantas !== "undefined" ? "foto-" + producto.id : "" };
    if (item.imagen && !item.imagen.includes("/")) item.imagen = "img/" + item.imagen;
    const opciones = [item];
    if (Number.isFinite(producto.precioAlternativo)) opciones.push({...item,id:item.id+"-alternativo",nombre:item.nombre+" (opción Bs "+producto.precioAlternativo+")",precio:producto.precioAlternativo});
    if (Number.isFinite(producto.precioTajada)) opciones.push({...item,id:item.id+"-tajada",nombre:item.nombre+" (tajada)",precio:producto.precioTajada});
    return opciones;
  });
  let datos = inventario;
  let indice = 0;
  let carrusel;
  let temporizadorPago;
  let esperaJuego;
  let pedidos = leer(":pedidos", []);
  if (!Array.isArray(pedidos)) pedidos = [];
  let vencimiento = Number(leer(":qr", 0)) || 0;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const boton = document.createElement("button");
  boton.id = "extras-catalogo";
  boton.type = "button";
  boton.textContent = "☰ Herramientas";
  boton.setAttribute("aria-haspopup", "dialog");
  const panel = document.createElement("dialog");
  panel.id = "panel-experiencia";
  panel.setAttribute("aria-labelledby", "x-titulo");
  panel.innerHTML = `
    <div class="x-barra"><h2 id="x-titulo">Herramientas del catálogo</h2><button type="button" data-cerrar>Cerrar</button></div>
    <nav class="x-controles" aria-label="Herramientas">
      <button type="button" data-panel="navegacion">Secciones</button>
      <button type="button" data-panel="vitrina">Galería</button>
      <button type="button" data-panel="pedido">Pedidos</button>
      <button type="button" data-panel="juego">Juego</button>
    </nav>
    <div class="x-panel" data-vista="navegacion">
      <div class="x-controles" data-secciones></div>
      <label>Tema <select data-tema><option value="">Original</option><option value="claro">Claro</option><option value="oscuro">Oscuro</option></select></label>
      <p data-conexion role="status"></p>
    </div>
    <div class="x-panel" data-vista="vitrina" hidden>
      <h3>Galería del catálogo</h3><div class="x-vitrina" data-foto></div>
      <p data-ficha aria-live="polite"></p><progress data-progreso aria-label="Posición en la galería"></progress>
      <div class="x-controles"><button type="button" data-paso="-1" aria-label="Anterior">←</button><button type="button" data-pausa>Pausar</button><button type="button" data-paso="1" aria-label="Siguiente">→</button></div>
    </div>
    <div class="x-panel" data-vista="pedido" hidden>
      <h3>Pedido de demostración</h3><p>Se guarda en este navegador. No realiza cobros ni envía pedidos.</p>
      <form data-pedido>
        <label>Producto <select name="producto" required></select></label>
        <label>Cantidad <input name="cantidad" type="number" min="1" max="99" value="1" required></label>
        <label>Fecha <input name="fecha" type="date" required></label>
        <label>Hora <input name="hora" type="time" required></label>
        <label>Nombre <input name="nombre" autocomplete="name" maxlength="80" required></label>
        <label>Teléfono <input name="telefono" type="tel" autocomplete="tel" pattern="[67][0-9]{7}" title="8 dígitos empezando por 6 o 7" required></label>
        <label>Correo <input name="correo" type="email" autocomplete="email" maxlength="120" required></label>
        <label>Pago simulado <select name="pago"><option>Efectivo</option><option>QR</option></select></label>
        <output data-resumen aria-live="polite"></output>
        <button type="submit">Guardar pedido de prueba</button>
      </form>
      <p data-confirmacion role="status"></p>
      <button type="button" data-ver-qr hidden>Ver QR de prueba</button>
      <div class="x-qr" data-qr hidden><img alt="QR de demostración sin datos de pago"><p data-reloj></p><button type="button" data-ocultar-qr>Ocultar QR</button></div>
      <h3>Mis pedidos de prueba</h3><ul data-historial></ul>
    </div>
    <div class="x-panel" data-vista="juego" hidden>
      <h3>Memoria del catálogo</h3><p>Encuentra las parejas de productos.</p>
      <p data-marcador role="status"></p><div class="x-memoria" data-memoria></div>
      <button type="button" data-reiniciar>Jugar de nuevo</button>
    </div>`;
  document.body.append(boton, panel);
  const $ = selector => panel.querySelector(selector);
  const viewport = window.visualViewport;
  if (viewport) {
    function ajustarPanel() {
      panel.style.setProperty("--x-alto-visible", Math.max(110, viewport.height - 24) + "px");
    }
    viewport.addEventListener("resize", ajustarPanel);
    ajustarPanel();
  }
  const secciones = [...document.querySelectorAll("main > section[id]")];
  for (const seccion of secciones) {
    const selector = '[href="#' + CSS.escape(seccion.id) + '"], [aria-controls="' + CSS.escape(seccion.id) + '"]';
    const original = [...document.querySelectorAll("nav " + selector.replace(", ", ", nav "))][0];
    const acceso = document.createElement("button");
    acceso.type = "button";
    acceso.textContent = original?.textContent.trim() || seccion.querySelector("h1,h2")?.textContent.trim() || seccion.id;
    acceso.addEventListener("click", () => {
      panel.close();
      if (original) original.click();
      else location.hash = seccion.id;
    });
    $("[data-secciones]").append(acceso);
  }
  const tema = $("[data-tema]");
  tema.value = leer(":tema", "");
  function aplicarTema() {
    if (tema.value) document.body.dataset.temaExtra = tema.value;
    else delete document.body.dataset.temaExtra;
    guardar(":tema", tema.value);
  }
  tema.addEventListener("change", aplicarTema);
  aplicarTema();
  let pausa = reduce.matches;
  let vista = "navegacion";
  function actualizarCarrusel() {
    clearInterval(carrusel);
    $("[data-pausa]").textContent = pausa ? "Reanudar" : "Pausar";
    if (panel.open && vista === "vitrina" && !pausa && !document.hidden && datos.length > 1) {
      carrusel = setInterval(() => avanzar(1), 6000);
    }
  }
  function animar(elemento) {
    elemento.classList.remove("x-entrada");
    requestAnimationFrame(() => elemento.classList.add("x-entrada"));
  }
  function mostrarVista(nombre) {
    vista = nombre;
    for (const elemento of panel.querySelectorAll("[data-vista]")) elemento.hidden = elemento.dataset.vista !== nombre;
    for (const control of panel.querySelectorAll("[data-panel]")) control.setAttribute("aria-pressed", String(control.dataset.panel === nombre));
    animar($('[data-vista="' + nombre + '"]'));
    actualizarCarrusel();
  }
  function avanzar(paso) {
    if (!datos.length) return;
    indice = (indice + paso + datos.length) % datos.length;
    const item = datos[indice];
    const marco = $("[data-foto]");
    marco.replaceChildren();
    if (item.imagen) {
      const img = document.createElement("img");
      img.alt = item.nombre;
      img.loading = "lazy";
      img.src = new URL(item.imagen, base);
      img.addEventListener("error", () => {
        if (marco.contains(img)) marco.textContent = item.nombre;
      }, { once:true });
      marco.append(img);
    } else if (item.clase) {
      const foto = document.createElement("div");
      foto.className = "foto " + item.clase;
      foto.setAttribute("role","img");
      foto.setAttribute("aria-label",item.nombre);
      marco.append(foto);
    } else marco.textContent = item.nombre;
    $("[data-ficha]").textContent = item.nombre + (item.precio === null ? "" : " · Bs " + item.precio.toFixed(2));
    const progreso = $("[data-progreso]");
    progreso.max = datos.length;
    progreso.value = indice + 1;
    animar(marco);
  }
  boton.addEventListener("click", () => { panel.showModal(); mostrarVista(vista); actualizarReloj(); });
  panel.addEventListener("close", () => { clearInterval(carrusel); clearInterval(temporizadorPago); });
  $("[data-cerrar]").addEventListener("click", () => panel.close());
  for (const control of panel.querySelectorAll("[data-panel]")) control.addEventListener("click", () => mostrarVista(control.dataset.panel));
  for (const control of panel.querySelectorAll("[data-paso]")) control.addEventListener("click", () => { avanzar(Number(control.dataset.paso)); actualizarCarrusel(); });
  $("[data-pausa]").addEventListener("click", () => { pausa = !pausa; actualizarCarrusel(); });
  document.addEventListener("visibilitychange", actualizarCarrusel);

  const form = $("[data-pedido]");
  const campos = form.elements;
  const fechaLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10);
  campos.fecha.min = fechaLocal;
  const elegido = () => datos.find(item => item.id === campos.producto.value);
  function resumen() {
    const item = elegido();
    const unidades = Number(campos.cantidad.value);
    $("[data-resumen]").textContent = item?.precio != null && unidades > 0
      ? "Total de referencia: Bs " + (item.precio * unidades).toFixed(2) : "Precio por confirmar";
  }
  function cargarOpciones() {
    const anterior = campos.producto.value;
    campos.producto.replaceChildren(...datos.map(item => new Option(item.nombre, item.id)));
    if (datos.some(item => item.id === anterior)) campos.producto.value = anterior;
    resumen();
    avanzar(0);
  }
  form.addEventListener("input", resumen);
  form.addEventListener("submit", evento => {
    evento.preventDefault();
    const item = elegido();
    const fecha = new Date(campos.fecha.value + "T" + campos.hora.value);
    const confirmar = $("[data-confirmacion]");
    if (!item || !campos.nombre.value.trim() || !Number.isFinite(+fecha) || fecha <= new Date()) {
      confirmar.textContent = "Escribe tu nombre y elige una fecha y hora futuras.";
      return;
    }
    const fechaTexto = campos.fecha.value + " " + campos.hora.value;
    if (pedidos.some(p => p.producto === item.nombre && p.fecha === fechaTexto)) {
      confirmar.textContent = "Ya tienes un pedido de prueba de este producto a esa hora.";
      return;
    }
    const pedido = { id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()), producto: item.nombre, cantidad: Number(campos.cantidad.value), fecha: fechaTexto, pago: campos.pago.value };
    const nuevos = [...pedidos, pedido];
    const persistido = guardar(":pedidos", nuevos);
    pedidos = nuevos;
    mostrarPedidos();
    confirmar.textContent = persistido ? "Pedido de prueba registrado en este navegador." : "Pedido de prueba temporal. No se pudo guardar al cerrar.";
    if (pedido.pago === "QR") {
      vencimiento = Date.now() + 600000;
      guardar(":qr", vencimiento);
      $("[data-qr]").hidden = false;
      actualizarReloj();
    }
  });
  function mostrarPedidos() {
    const lista = $("[data-historial]");
    lista.replaceChildren();
    for (const pedido of pedidos) {
      const item = document.createElement("li");
      const cancelar = document.createElement("button");
      cancelar.type = "button";
      cancelar.textContent = "Eliminar";
      cancelar.addEventListener("click", () => {
        pedidos = pedidos.filter(registro => registro.id !== pedido.id);
        const persistido = guardar(":pedidos", pedidos);
        mostrarPedidos();
        $("[data-confirmacion]").textContent = persistido ? "Pedido de prueba eliminado." : "Se eliminó de esta vista, pero no del almacenamiento.";
        campos.producto.focus();
      });
      item.append(document.createTextNode(pedido.cantidad + " × " + pedido.producto + " · " + pedido.fecha + " · " + pedido.pago + " "), cancelar);
      lista.append(item);
    }
    if (!pedidos.length) {
      const vacio = document.createElement("li");
      vacio.textContent = "Aún no hay pedidos de prueba.";
      lista.append(vacio);
    }
  }
  $("[data-qr] img").src = new URL("qr-demo.svg", recurso);
  $("[data-ocultar-qr]").addEventListener("click", () => { $("[data-qr]").hidden = true; $("[data-ver-qr]").focus(); });
  $("[data-ver-qr]").addEventListener("click", () => { $("[data-qr]").hidden = false; actualizarReloj(); });
  function actualizarReloj() {
    clearInterval(temporizadorPago);
    function pintar() {
      const segundos = Math.max(0, Math.ceil((vencimiento - Date.now()) / 1000));
      $("[data-ver-qr]").hidden = !segundos;
      $("[data-reloj]").textContent = segundos
        ? Math.floor(segundos / 60) + ":" + String(segundos % 60).padStart(2,"0")
        : "El QR de prueba venció.";
      $("[data-qr] img").hidden = !segundos;
      if (!segundos) clearInterval(temporizadorPago);
      return segundos;
    }
    if (pintar() && panel.open) temporizadorPago = setInterval(pintar, 1000);
  }
  mostrarPedidos();

  function iniciarJuego() {
    clearTimeout(esperaJuego);
    const cartas = datos.filter(item => !item.id.includes("-")).slice(0,3);
    const mazo = [...cartas,...cartas];
    for (let i = mazo.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    const tablero = $("[data-memoria]");
    const marcador = $("[data-marcador]");
    let primera, bloqueado = false, aciertos = 0, intentos = 0;
    tablero.replaceChildren();
    marcador.textContent = "Parejas: 0 · Intentos: 0";
    for (const carta of mazo) {
      const pieza = document.createElement("button");
      pieza.type = "button";
      pieza.textContent = "?";
      pieza.setAttribute("aria-label","Carta " + (tablero.children.length + 1));
      pieza.addEventListener("click", () => {
        if (bloqueado || primera?.pieza === pieza) return;
        pieza.textContent = carta.nombre;
        pieza.setAttribute("aria-label",carta.nombre);
        if (!primera) { primera = { pieza, carta }; return; }
        intentos++;
        if (primera.carta.id === carta.id) {
          primera.pieza.disabled = pieza.disabled = true;
          aciertos++;
          primera = null;
        } else {
          bloqueado = true;
          const previa = primera.pieza;
          esperaJuego = setTimeout(() => {
            for (const control of [pieza, previa]) {
              control.textContent = "?";
              control.setAttribute("aria-label","Carta " + ([...tablero.children].indexOf(control) + 1));
            }
            primera = null;
            bloqueado = false;
          }, 850);
        }
        marcador.textContent = "Parejas: " + aciertos + " · Intentos: " + intentos + (aciertos === cartas.length ? " · ¡Completado!" : "");
      });
      tablero.append(pieza);
    }
  }
  $("[data-reiniciar]").addEventListener("click", iniciarJuego);
  cargarOpciones();
  iniciarJuego();
  function conexion() { $("[data-conexion]").textContent = navigator.onLine ? "Con conexión" : "Sin conexión"; }
  window.addEventListener("online", conexion);
  window.addEventListener("offline", conexion);
  window.addEventListener("pagehide", () => { clearInterval(carrusel); clearInterval(temporizadorPago); });
  window.addEventListener("pageshow", () => { conexion(); actualizarCarrusel(); actualizarReloj(); });
  conexion();

  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 4500);
  window.addEventListener("pagehide", () => controlador.abort(), { once:true });
  fetch(new URL("productos.json", recurso), { signal: controlador.signal }).then(respuesta => {
    if (!respuesta.ok) throw new Error("No se pudo cargar el catálogo.");
    return respuesta.json();
  }).then(items => {
    if (!Array.isArray(items) || items.length !== inventario.length ||
      items.some((item,i) => !item || item.id !== inventario[i].id || typeof item.nombre !== "string" || item.nombre.length > 120 ||
        !(item.precio === null || (Number.isFinite(item.precio) && item.precio >= 0)) ||
        item.imagen !== inventario[i].imagen || item.clase !== inventario[i].clase)) return;
    datos = items;
    cargarOpciones();
  }).catch(() => { /* Los datos originales mantienen disponible la interfaz. */ }).finally(() => clearTimeout(limite));

  if (isSecureContext && "serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register(new URL("sw.js", base), { scope:base.href, updateViaCache:"none" }).catch(() => {});
  }
})();
