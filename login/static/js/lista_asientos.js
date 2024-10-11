document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterButton = document.getElementById('filterButton');
    const clearButton = document.getElementById('clearButton');
    const asientosBody = document.getElementById('asientos-body');
    const today = new Date(); // Obtiene la fecha actual
    today.setDate(today.getDate() + 1);
    console.log(today);

    // Agrega event listeners para validar el rango de fechas
    filterButton.addEventListener('click', async function() {

        //verifica que se hayan seleccionado ambas fechas
        if (startDateInput.value == "" || endDateInput.value == "") {
            Swal.fire({
                text: "Debes seleccionar un rango de fechas.",
                icon: "info"
            });
        }

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

        } else if (startDate > endDate) {
            Swal.fire({
                text: "La fecha de inicio no puede ser mayor que la fecha final.",
                icon: "info"
            });
        }
        else if (startDateInput.value == "" || endDateInput.value == "") {
            Swal.fire({
                text: "Debes seleccionar un rango de fechas.",
                icon: "info"
            });
        }

        else {
            const startDateParse = startDate.toLocaleDateString('es-AR');
            const endDateParse = endDate.toLocaleDateString('es-AR');
            console.log("fecha start parseada",startDateParse);
            console.log("fecha end parseada",endDateParse);

            while (asientosBody.firstChild) {
                asientosBody.removeChild(asientosBody.firstChild);
            }
            
            let asientosFiltrados = await getAsientosFiltrados(startDateParse, endDateParse)

            if (asientosFiltrados.length > 0) {
                asientosFiltrados.forEach(asiento => {
                    // Crea una nueva fila
                    const row = document.createElement("tr");
                
                    // Agrega celdas con datos del asiento
                    const fechaCell = document.createElement("td");
                    fechaCell.textContent = asiento.fecha;
                
                    const idCell = document.createElement("td");
                    idCell.textContent = asiento.id;
                
                    const descripcionCell = document.createElement("td");
                    descripcionCell.textContent = asiento.descripcion;
    
                    // Crea una celda adicional con el enlace "Ver detalle"
                    const detalleCell = document.createElement("td");
                    const enlaceDetalle = document.createElement("a");
                    enlaceDetalle.href = "detalles_asiento/" + asiento.id;
                    enlaceDetalle.textContent = "Ver detalle";
                    detalleCell.appendChild(enlaceDetalle);
                
                    // Agrega las celdas a la fila
                    row.appendChild(fechaCell);
                    row.appendChild(idCell);
                    row.appendChild(descripcionCell);
                    row.appendChild(detalleCell);
                
                    // Agrega la fila al tbody
                    asientosBody.appendChild(row);
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
    const csrfToken = getCookie('csrftoken');

    async function getAsientosFiltrados(startDate, endDate) {
        asientos = []
    
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
                asientos = data.asientos
            })
            return asientos
    }
});
