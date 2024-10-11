document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterButton = document.getElementById('filterButton');
    const clearButton = document.getElementById('clearButton');
    const asientosBody = document.getElementById('asientos-body');
    const today = new Date(); // Obtiene la fecha actual
    today.setDate(today.getDate() + 1);

    // Agrega event listeners para validar el rango de fechas
    filterButton.addEventListener('click', async function() {

        const startDate = new Date(startDateInput.value);
        startDate.setDate(startDate.getDate() + 1);

        const endDate = new Date(endDateInput.value);
        endDate.setDate(endDate.getDate() + 1);


        console.log(startDate);
        console.log(endDate);

        if (startDate > today || endDate > today) {
            Swal.fire({
                text: "No puedes seleccionar una fecha mayor que el día de hoy.",
                icon: "info"
            });
        }
        else if (startDate > endDate) {
            Swal.fire({
                text: "La fecha de inicio no puede ser mayor que la fecha final.",
                icon: "info"
            });
        }
        else {
            const startDateParse = startDate.toLocaleDateString('es-AR');
            const endDateParse = endDate.toLocaleDateString('es-AR');

            console.log("aca va la fecha", startDateParse, endDateParse);

            while (asientosBody.firstChild) {
                asientosBody.removeChild(asientosBody.firstChild);
            }
            
            let dataJSON = await getAsientosFiltrados(startDateParse, endDateParse)
            
            let asientos = dataJSON.asientos
            let asientoCuentas = dataJSON.asientoCuentas

            console.log(asientos, asientoCuentas);

            if (asientos.length > 0) {
                asientos.forEach(async asiento => {
                    let contador = 0
                    
                    asientoCuentas.forEach( async c_a => {
                        if (c_a.id_asiento == asiento.id) {
                            if (contador == 0) {
                                const row = document.createElement("tr");
                
                                // Agrega celdas con datos del asiento
                                const fechaCell = document.createElement("td");
                                fechaCell.textContent = asiento.fecha;
                            
                                const descripcionCell = document.createElement("td");
                                descripcionCell.textContent = asiento.descripcion;

                                const cuentaNombreCell = document.createElement("td");
                                cuentaNombreCell.textContent = c_a.nombre_cuenta;

                                const debeCell = document.createElement("td");
                                debeCell.textContent = c_a.debe;

                                const haberCell = document.createElement("td");
                                haberCell.textContent = c_a.haber;
                                
                                row.appendChild(fechaCell);
                                row.appendChild(descripcionCell);
                                row.appendChild(cuentaNombreCell);
                                row.appendChild(debeCell);
                                row.appendChild(haberCell);
                                
                                asientosBody.appendChild(row);
                                contador += 1
                            } else {
                                const row = document.createElement("tr");             

                                const cuentaNombreCell = document.createElement("td");
                                cuentaNombreCell.textContent = c_a.nombre_cuenta;

                                const debeCell = document.createElement("td");
                                debeCell.textContent = c_a.debe;

                                const haberCell = document.createElement("td");
                                haberCell.textContent = c_a.haber;
                                
                                row.appendChild(document.createElement("td"));
                                row.appendChild(document.createElement("td"));
                                row.appendChild(cuentaNombreCell);
                                row.appendChild(debeCell);
                                row.appendChild(haberCell);


                                asientosBody.appendChild(row);
                            }
                            
                        }

                    })

                    contador += 1
    
                });
            } else {
                Swal.fire({
                    "text": "No hay asientos registrados en ese intervalo",
                    "icon": "info"
                })
            }
        }
    });

    clearButton.addEventListener('click', function() {
        startDateInput.value = '';
        endDateInput.value = '';
    });

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

    const urlGetAsientosFiltrados = "/get-asientos-filtrados"
    const urlGetNombreCuenta = "/get-nombre-cuenta"
    const csrfToken = getCookie('csrftoken');

    async function getAsientosFiltrados(startDate, endDate) {
        let dataToSend = {}
    
        await fetch(urlGetAsientosFiltrados, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({'startDate': startDate, 'endDate': endDate})
        })
            .then(response => {
                return response.json()
            })
            .then(data => {
                dataToSend = {
                    asientos: data.asientos,
                    asientoCuentas: data.asientoCuentas
                };

                console.log('dataToSend', dataToSend);
                console.log('data', data);
            })
            return dataToSend
    }


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

    // Simula un clic en el botón
    filterButton.click();
});
