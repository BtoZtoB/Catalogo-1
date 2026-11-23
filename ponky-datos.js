/* Precios de Ponky en bolivianos.
   Coloca tus propias fotos y el logo en img/ con los nombres indicados. */
window.CATALOGO_PERSONALIZADO = Object.freeze({
  nombre: 'Ponky',
  formatearPrecio(producto, separador = " · ") {
    if (!Number.isFinite(producto.precio)) return 'Precio por confirmar';
    const precio = 'Bs ' + producto.precio.toFixed(2);
    if (!Number.isFinite(producto.precioTajada)) return precio;
    return 'Entero: ' + precio + separador + 'Tajada: Bs ' + producto.precioTajada.toFixed(2);
  },
  categorias: {'1':'Panadería','2':'Repostería','3':'Kits personalizados'},
  productos: [
    {id:1,nombre:'Empanadas',categoria:'1',precio:2.50,imagen:'img/empanadas.jpg',color:'#f8e7c3',descripcion:'Empanadas de Ponky. Consulta las opciones y disponibilidad.'},
    {id:2,nombre:'Rollo de queso',categoria:'1',precio:20,precioTajada:2.50,imagen:'img/rollo-de-queso.jpg',color:'#fbe8bf',descripcion:'Rollo de queso para disfrutar y compartir. Consulta la disponibilidad.'},
    {id:3,nombre:'Queque',categoria:'2',precio:25,precioTajada:2.50,imagen:'img/queque.jpg',color:'#f1d8bb',descripcion:'Queque de Ponky. Consulta las opciones de presentación y disponibilidad.'},
    {id:4,nombre:'Mini rollo de queso',categoria:'1',precio:2.50,imagen:'img/mini-rollo-de-queso.jpg',color:'#f8e6c9',descripcion:'Mini rollo de queso. Consulta las cantidades disponibles.'},
    {id:5,nombre:'Pucas',categoria:'1',precio:4,imagen:'img/pucas.jpg',color:'#eed8b9',descripcion:'Pucas de Ponky. Consulta las opciones y disponibilidad.'},
    {id:6,nombre:'Kit de graduación',categoria:'3',precio:60,imagen:'img/kit-de-graduacion.jpg',color:'#f9dfae',descripcion:'Un jugo de manzana Del Valle, 2 empanadas, un mini rollo de queso, una tajada de queque y 6 mini donas. Personalízalo con el nombre de quien lo recibe, el logo de su universidad u otra imagen e indicaciones especiales.'}
  ]
});
