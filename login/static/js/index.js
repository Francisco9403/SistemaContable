document.addEventListener('DOMContentLoaded', async function () {
    const asientosBody = document.getElementById('asientos-body');
    const agregarButton = document.getElementById('agregar');
    const registrarButton = document.getElementById('registrar');
    const editarUltimoRenglonButton = document.getElementById('editar_renglon');
    const borrarUltimoRenglonButton = document.getElementById('borrar_renglon');
    let editando = false

    let asientosData = []; // Almacenar los asientos en un arreglo
   
    let asientosToBackEnd = []; //guardo los asientos para enviar al back

    let cuentas_usadas = []; //guardo las cuentas usadas para no repetirlas

    function addRowToTable(asiento, index) {
        const newRow = document.createElement('tr');
        if (asiento.debeohaber === 'debe') {
            newRow.innerHTML = `
            <td>${asiento.nombre_cuenta}</td>
            <td>${asiento.monto}</td>
            <td></td>
        `;
        } else {
            newRow.innerHTML = `
            <td>${asiento.nombre_cuenta}</td>
            <td></td>
            <td>${asiento.monto}</td>
        `;
        }

        newRow.dataset.index = index; // Establecer un atributo de datos para rastrear el índice en el arreglo

        // Agregar la fila a la tabla
        asientosBody.appendChild(newRow);
    }

    function resetForm() {
        // Limpiar el formulario y restablecer el estado de edición
        const cuenta_id = document.getElementById('cuenta');
        const monto = document.getElementById('monto');
        let radioButtons = document.getElementsByName("debeohaber");

        // Itera a través de los radio buttons y deselecciónalos
        for (let i = 0; i < radioButtons.length; i++) {
            radioButtons[i].checked = false;
        }

        monto.value = ''
        cuenta_id.selectedIndex = 0;
    }

    registrarButton.addEventListener('click', function () {

        //validaciones para registrar
        entrar = false;

        if (asientosData.length === 0) {
            entrar = true;
            Swal.fire({
                "text": "No hay asientos para registrar",
                "icon": "error"
            })
        }

        let montoDebe = 0;
        let montoHaber = 0;
        console.log('asiento data', asientosData);
        for (asiento of asientosData) {
            console.log('debe o haber', asiento.debeohaber);
            if (asiento.debeohaber === 'debe') {
                montoDebe += parseFloat(asiento.monto);
            } else {
                montoHaber += parseFloat(asiento.monto);
            }
            console.log("montoDebe", montoDebe);
            console.log("montoHaber", montoHaber);
        }

        if (montoDebe !== montoHaber) {
            Swal.fire({
                "text": "El debe y el haber no coinciden",
                "icon": "error"
            })
            entrar = true;
        }

        if (entrar === false) {
            const descripcion = document.getElementById('descripcion').value;
            const fecha = document.getElementById('datepicker').value;


            const dataToSend = {
                asientosToBackEnd: asientosToBackEnd,
                descripcion: descripcion,
                fecha: fecha
            };
            const apiUrl = '/registrar_asiento/'; // Reemplaza con la URL de tu backend

            const csrfToken = getCookie('csrftoken');

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Tipo de contenido que estamos enviando (JSON)
                    'X-CSRFToken': csrfToken  // Incluimos el token CSRF en el encabezado
                },
                body: JSON.stringify(dataToSend) // Convierte el objeto data a JSON y lo envía en el cuerpo
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
                resetForm();
                asientosToBackEnd.length = 0;
                console.log('Respuesta exitosa:', data);
                Swal.fire({
                    "title": data.titulo,
                    "text": data.mensaje,
                    "icon": data.tipo
                }).then(function() {
                    // Redirect the user
                    window.location.href = "http://127.0.0.1:8000/";
                    });
            })
            .catch(error => {
                // Manejar errores en la solicitud
                console.error('Error:', error);
            });
        
        }
    });

    agregarButton.addEventListener('click', async function () {
        try {
            const monto = document.getElementById('monto').value;
            const debeohaber = document.querySelector('input[name="debeohaber"]:checked').value;
            const cuenta_id = document.getElementById('cuenta').value; //hay que cambiar el valor que selecciona
            const nombre_cuenta = await getNombreCuenta(cuenta_id)
            console.log('cuenta: ', nombre_cuenta, 'monto: ', monto, 'debeohaber: ', debeohaber);

            const asientoJSON = {
                idCuenta: cuenta_id,
                monto: monto,
                debeohaber: debeohaber
            };
            

            // Crear un nuevo asiento y agregarlo al arreglo

            //validaciones

            let entrar = false;

            if(cuentas_usadas.includes(cuenta_id) || cuenta_id === ''){
                entrar = true;
                Swal.fire({
                    "text": "No es posible utilizar más de una vez la misma cuenta",
                    "icon": "error"
                })
            }

            if (monto <= 0 || monto === '' || monto === null) {
                entrar = true
                Swal.fire({
                    "text": "Ingrese un monto valido.",
                    "icon": "error"
                })
            }
        
            if (debeohaber.checked === false) {
                entrar = true
                Swal.fire({
                    "text": "Ingrese correctamente si va por el 'Debe' o por el 'Haber'.",
                    "icon": "error"
                })
            }
            
            let auxData = await isValidSaldo(cuenta_id, monto, debeohaber)
            console.log("auxData: ", auxData)
            let auxValue = auxData[0]
            let auxMensaje = auxData[1]
            if (!auxValue) {
                entrar = true
                Swal.fire({
                    "text": auxMensaje,
                    "icon": "error"
                })
            }

            if (entrar === false) {
                if (editando === true) {
                    asientosData.pop();
                    asientosToBackEnd.pop();
                    asientosBody.deleteRow(-1)
                    editando = false
                }

                const newAsiento = {
                    nombre_cuenta,
                    monto,
                    debeohaber
                };

                asientosData.push(newAsiento);        //guardo el asiento para mostrar en la tabla
                cuentas_usadas.push(cuenta_id);       //guardo la cuenta para no repetirla
                asientosToBackEnd.push(asientoJSON); //guardo el asiento para enviar al back

                // Agregar una nueva fila a la tabla
                addRowToTable(newAsiento, asientosData.length - 1);

                resetForm();
            }
        } catch (error) {
            console.log(error);
            Swal.fire({
                "text": "Complete los campos correspondientes",
                "icon": "error"
            })
        }
    });

    editarUltimoRenglonButton.addEventListener('click', function () {
        if (asientosToBackEnd.length > 0) {
            editando = true
            let ultimoAsiento = asientosToBackEnd[asientosToBackEnd.length - 1]
            const cuenta_id = document.getElementById('cuenta');
            const monto = document.getElementById('monto');
            const debeohaber = document.getElementsByName("debeohaber");

            cuenta_id.value = ultimoAsiento.idCuenta
            monto.value = ultimoAsiento.monto

            if (ultimoAsiento.debeohaber === "haber") {
                debeohaber[1].checked = true
            }else{
                debeohaber[0].checked = true
            }

            cuentas_usadas.pop()

        }else{
            Swal.fire({
                "text": "No hay asientos para editar",
                "icon": "error"
            })
        }

    });


    borrarUltimoRenglonButton.addEventListener('click', function () {
        if (editando === true) {
            Swal.fire({
                "text": "Termina de editar el asiento para borrar",
                "icon": "info"
            })
        } else {
            if (asientosToBackEnd.length > 0) {
                asientosData.pop();
                asientosToBackEnd.pop();
                cuentas_usadas.pop()
                asientosBody.deleteRow(-1)
            }else{
                Swal.fire({
                    "text": "No hay asientos para borrar",
                    "icon": "error"
                })
            }
        }
    });


    // Realiza una solicitud AJAX o utiliza una variable global para obtener el próximo ID de la tabla 'Asiento'
    obtenerProximoID();  // Reemplaza esto con la lógica real para obtener el próximo ID
    
    // Obtiene el campo 'numero' por su ID y establece el valor y lo deshabilita
    // let numeroField = document.getElementById("numero");
    // numeroField.value = proximoID;
    // numeroField.disabled = true;

});

function obtenerProximoID() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/getIdAsiento/", true);  // Reemplaza "/ruta_a_tu_vista/" con la URL correcta
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = function () {
        if (xhr.status === 200) {
            let respuesta = JSON.parse(xhr.responseText);
            let proximoID = respuesta.proximo_id;
            
            // Obtiene el campo 'numero' por su ID y establece el valor y lo deshabilita
            let numeroField = document.getElementById("numero");
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

const urlGetNombreCuenta = "/get-nombre-cuenta"
const csrfToken = getCookie('csrftoken');


async function getNombreCuenta(idCuenta) {
    let nombre = ""

    await fetch(urlGetNombreCuenta, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({'id_cuenta': idCuenta})
    })
        .then(response => {
            return response.json()
        })
        .then(data => {
            let value = data['nombre']
            nombre = value
        })
    return nombre;
}

async function isValidSaldo(idCuenta, monto, tipoOperacion) {
    const URL = "/is-valid-saldo"
    let datos = []
    const csrfToken = getCookie('csrftoken');

    await fetch(URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({'id_cuenta': idCuenta, 'monto': monto, 'tipo_operacion': tipoOperacion })
    })
        .then(response => {
            return response.json()
        })
        .then(data => {
            let value = data['value']
            console.log(data['mensaje'])
            auxValue = value
            
            datos.push(data["value"])
            datos.push(data['mensaje'])
        })
    // return auxValue
    return datos
}