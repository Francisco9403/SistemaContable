document.addEventListener('DOMContentLoaded', async function () {
    const productosBody = document.getElementById('productos-body');
    const registrarButton = document.getElementById('registrar');
    const agregarButton = document.getElementById('agregar');
    const editarUltimoRenglonButton = document.getElementById('editar_renglon');
    const borrarUltimoRenglonButton = document.getElementById('borrar_renglon');
    const totalVentaDiv = document.getElementById('total-venta');
    let editando = false;
    let productosToBackEnd = [];
    let productos_usados = [];
    let monto_total_venta = 0;


    
    function calcularTotalVenta() {
        let total = 0;
        for (let i = 0; i < productosToBackEnd.length; i++) {
            total += productosToBackEnd[i].subtotal;
        }
        return total;
    }

    function actualizarTotalVenta() {
        const totalVentaDiv = document.getElementById('total-venta');
        const totalVenta = calcularTotalVenta();
        totalVentaDiv.textContent = '🛒 Total de la venta: $' + totalVenta.toFixed(2); // Ajusta a dos decimales si es necesario
    }

    document.addEventListener('DOMContentLoaded', function () {
        actualizarTotalVenta();
    });


    function addRowToTable(producto, index) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${producto.cantidad}</td>
        <td>${producto.precio_unitario}</td>
        <td>${producto.subtotal}</td>
        `;
        
        newRow.dataset.index = index; // Establecer un atributo de datos para rastrear el índice en el arreglo

        // Agregar la fila a la tabla
        productosBody.appendChild(newRow);
    }

    function resetForm() {
        // Limpiar el formulario y restablecer el estado de edición
        const producto_id = document.getElementById('productos');
        const cantidad = document.getElementById('cantidad');

        cantidad.value = ''
        producto_id.selectedIndex = 0;
    }


    registrarButton.addEventListener('click', function (event) {
        entrar = false;

        if (productosToBackEnd.length === 0) {
            entrar = true;
            Swal.fire({
                "text": "No hay productos para registrar",
                "icon": "error"
            })
        }

        if (entrar === false) {
            const cliente = document.getElementById('cliente').value;
            const fecha = document.getElementById('datepicker').value;
            const formaPago = document.getElementById('formaPago').value;
            const vendedor = document.getElementById('vendedor').value;
            const descripcion = document.getElementById('descripcion').value;

            const ventaJSON = {
                cliente: cliente,
                fecha: fecha,
                formaPago: formaPago,
                vendedor: vendedor,
                descripcion: descripcion,
                productos: productosToBackEnd,
                monto_total_venta: monto_total_venta
            };

            for (let key in ventaJSON) {
                console.log(`${key}: ${ventaJSON[key]}`);
                if (ventaJSON[key] === "") {
                    event.preventDefault();
                    Swal.fire({
                        "text": `El campo ${key} esta vacio`,
                        "icon": "warning"
                    })
                    return 0;
                }
            }

            const apiUrl = '/registrar_venta/';
            const csrfToken = getCookie('csrftoken');
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Tipo de contenido que estamos enviando (JSON)
                    'X-CSRFToken': csrfToken  // Incluimos el token CSRF en el encabezado
                },
                body: JSON.stringify(ventaJSON) // Convierte el objeto data a JSON y lo envía en el cuerpo
            })
            .then(response => {
                if (response.ok) {
                // La solicitud se completó con éxito, puedes hacer algo con la respuesta si es necesario
                return response.json(); // Si la respuesta es JSON
                } else {
                // La solicitud falló, maneja el error aquí si es necesario
                throw new Error('Error en la solicitud');
                }
            })
            .then(data => {
                // Aquí puedes manejar la respuesta del servidor si es necesario
                // resetForm();
                console.log('Respuesta exitosa:', data);
                Swal.fire({
                    "title": data.titulo,
                    "text": data.mensaje,
                    "icon": data.tipo
                }).then(function() {
                    // Redirect the user
                    window.location.href = "http://127.0.0.1:8000/accounts/informe_ventas/";
                    });
            })
            .catch(error => {
                // Manejar errores en la solicitud
                console.error('Error:', error);
            });
        }
    })

    agregarButton.addEventListener('click', async function () {
        try {
            const producto_id = document.getElementById('productos').value;
            const producto_detalles = await getDetallesProducto(producto_id);
            const cantidad = document.getElementById('cantidad').value;

            console.log("producto_detalles:", producto_detalles, "Cantidad:", cantidad);
            
            const productoJSON = {
                producto_id: producto_id,
                nombre: producto_detalles.nombre,
                cantidad: cantidad,
                precio_unitario: producto_detalles.precio,
                subtotal: producto_detalles.precio * cantidad
            };
            
            let entrar = false;

            if(productos_usados.includes(producto_id) || producto_id === ''){
                entrar = true;
                Swal.fire({
                    "text": "No es posible utilizar más de una vez un mismo producto",
                    "icon": "error"
                })
            }

            if (cantidad <= 0 || cantidad === '' || cantidad === null || cantidad > producto_detalles.stock) {
                entrar = true
                Swal.fire({
                    "text": "Ingrese una cantidad válida o verifique si hay stock suficiente.",
                    "icon": "error"
                })
            }
            

            if (entrar === false) {
                if (editando === true) {
                    monto_total_venta -= productosToBackEnd[productosToBackEnd.length - 1].subtotal
                    productosToBackEnd.pop();
                    productosBody.deleteRow(-1)
                    editando = false
                }
                
                productos_usados.push(producto_id);
                productosToBackEnd.push(productoJSON);
                monto_total_venta += productoJSON.subtotal;


                // Agregar una nueva fila a la tabla
                addRowToTable(productoJSON, productosToBackEnd.length - 1);

                resetForm();
            }
        } catch (error) {
            console.log(error);
            Swal.fire({
                "text": "Complete los campos correspondientes",
                "icon": "error"
            })
        }
        actualizarTotalVenta();
    });

    editarUltimoRenglonButton.addEventListener('click', function () {
        if (productosToBackEnd.length > 0) {
            editando = true
            let ultimoProducto = productosToBackEnd[productosToBackEnd.length - 1]
            const producto_id = document.getElementById('productos');
            const cantidad = document.getElementById('cantidad');

            producto_id.value = ultimoProducto.producto_id
            cantidad.value = ultimoProducto.cantidad

            productos_usados.pop()

        }else{
            Swal.fire({
                "text": "No hay productos para editar",
                "icon": "error"
            })
        }
        actualizarTotalVenta();
    });

    borrarUltimoRenglonButton.addEventListener('click', function () {
        if (editando === true) {
            Swal.fire({
                "text": "Termina de editar para borrar",
                "icon": "info"
            })
        } else {
            if (productosToBackEnd.length > 0) {
                monto_total_venta -= productosToBackEnd[productosToBackEnd.length - 1].subtotal
                productosToBackEnd.pop();
                productos_usados.pop()
                productosBody.deleteRow(-1)
            }else{
                Swal.fire({
                    "text": "No hay productos para borrar",
                    "icon": "error"
                })
            }
        }
        actualizarTotalVenta();
    });

    obtenerProximoIdVenta();

});

function obtenerProximoIdVenta() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/getIdVenta/", true);  // Reemplaza "/ruta_a_tu_vista/" con la URL correcta
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = function () {
        if (xhr.status === 200) {
            let respuesta = JSON.parse(xhr.responseText);
            let proximoID = respuesta.proximo_id;
            
            // Obtiene el campo 'codigo' por su ID y establece el valor y lo deshabilita
            let numeroField = document.getElementById("codigo");
            numeroField.value = proximoID;
            numeroField.disabled = true;
        }
    };

    xhr.send();
}


function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const urlGetDetallesProducto = "/get-detalle-producto"
const csrfToken = getCookie('csrftoken');


async function getDetallesProducto(idProducto) {
    let detalles_producto = {}

    await fetch(urlGetDetallesProducto, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({'id_producto': idProducto})
    })
        .then(response => {
            return response.json()
        })
        .then(data => {
            detalles_producto = {
                nombre: data['nombre'],
                precio: data['precio'],
                stock: data['stock']
            }
            
        })
    return detalles_producto;
}
