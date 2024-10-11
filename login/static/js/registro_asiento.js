const datosAsiento = document.querySelector('asiento-form');
const agregar = document.getElementById('agregar');
const numeroAsiento = document.getElementById('numero').value;
const descripcion = document.getElementById('descripcion').value;
const cuenta = document.getElementById('cuenta').value; //hay que cambiar el valor que selecciona
const monto = document.getElementById('monto').value;
const debeohaber = document.querySelector('input[name="debeohaber"]:checked').value;


agregar.addEventListener('click', (event) => {
    event.preventDefault(); // Evita que el formulario se envíe automáticamente

    const asiento = {
      numeroAsiento,
      descripcion,
      cuenta,
      monto,
      debeohaber
  };
  
    //const datos = new FormData(datosAsiento); // Obtiene los datos del formulario    VER SI ANDA
    
    console.log(datos);

    const requestOptions = {
        method: 'POST',               // Método HTTP POST
        headers: {
            'Content-Type': 'application/json', // Tipo de contenido que estamos enviando (JSON)
            //'X-CSRFToken': csrfToken  // Incluimos el token CSRF en el encabezado
        },
        body: JSON.stringify(asiento)     // Convertimos el objeto 'asiento' a JSON y lo incluimos en el cuerpo de la solicitud
        };

  
    fetch('/ruta-del-backend', requestOptions)
    .then(response => {
      // Verificamos si la respuesta tiene un código de estado exitoso (por ejemplo, 200 OK)
      if (response.ok) {
      // Si la respuesta es exitosa, parseamos la respuesta JSON
      return response.json();
      } else {
      // Si la respuesta no es exitosa, lanzamos un error
      throw new Error('Error en la solicitud');
      }
  })
  .then(data => {
      // Hacemos algo con los datos de la respuesta (por ejemplo, mostrarlos en la consola)
      console.log('Respuesta exitosa:', data);
      Swal.fire({
          "title": data.titulo,
          "text": data.mensaje,
          "icon": data.tipo
      })
  })
  .catch(error => {
      // Manejamos errores en caso de que la solicitud falle
      console.error('Error:', error);
  });
});