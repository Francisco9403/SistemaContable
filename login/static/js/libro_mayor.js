document.addEventListener('DOMContentLoaded', async function () {

    const aplicarCuentaButton = document.getElementById('aplicar_cuenta');
    const cuenta = document.getElementById('cuenta');
    const asientosBody = document.getElementById('asientos-body');
    const startDateInput = document.getElementById('startDate')
    const endDateInput = document.getElementById('endDate')
    const today = new Date();
    today.setDate(today.getDate() + 1);
    console.log(today);


    let botonActivado = false;

    aplicarCuentaButton.addEventListener('click', async function () {
        if (botonActivado){
            aplicarCuentaButton.innerHTML = "Filtrar"
            botonActivado = false
            while (asientosBody.firstChild) {
                asientosBody.removeChild(asientosBody.firstChild);
            }
            return 0;
        }

        let idCuenta = cuenta.value
        let cuentaAsientos = []

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

        else{
        
            const startDateParse = startDate.toLocaleDateString('es-AR');
            const endDateParse = endDate.toLocaleDateString('es-AR');

            console.log("aca va la fecha", startDateParse, endDateParse);


            dataJSON = await getCuentaAsientos(idCuenta, startDateParse, endDateParse)

            cuentaAsientos = dataJSON.cuentaAsientos
            saldo_final = dataJSON.saldo_final
        
            console.log(cuentaAsientos)

            let contador = 1
            if (cuentaAsientos.length > 0) {
                for (let i = 0; i < cuentaAsientos.length; i++) {
                    const asientosBody = document.getElementById('asientos-body')
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `
                        <td>${cuentaAsientos[i][0]}</td>
                        <td>${cuentaAsientos[i][1]}</td>
                        <td>${cuentaAsientos[i][2]}</td>
                        <td>${cuentaAsientos[i][3]}</td>
                        <td>${cuentaAsientos[i][4]}</td>
                    `;
                    asientosBody.appendChild(newRow)
    
                    console.log("acaaaaaaaaaaaaaaaaaaaaaaa: ", cuentaAsientos[i][0], cuentaAsientos[i][1], cuentaAsientos[i][2], cuentaAsientos[i][3], cuentaAsientos[i][4])
                    console.log("acaaaaaaaaaaaaaaaaaaaaaaa: ", cuentaAsientos[i])
    
                    contador+=1
                    console.log(contador)
                }
    
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><b>Saldo final</b></td>
                    <td>${saldo_final}</td>
                `;
            
                asientosBody.appendChild(newRow)

                botonActivado = true
                aplicarCuentaButton.innerHTML = "Borrar filtro"
            } else {
                Swal.fire({
                    "text": "No hay asientos registrados en ese intervalo",
                    "icon": "info"
                })
            }
        }
    })

})



async function getCuentaAsientos(idCuenta, startDate, endDate) {
    let urlGetCuentaAsientos = '/get-cuenta-asientos';
    let cuentaAsientos = []
    const csrfToken = getCookie('csrftoken');


    await fetch(urlGetCuentaAsientos, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({'id_cuenta': idCuenta, 'startDate': startDate, 'endDate': endDate})
    })
        .then(response => {
            return response.json()
        })
        .then(data => {
            cuentaAsientos = data['cuenta_asientos']
            mensaje = data['mensaje']
            saldo_final = data['saldo_final']
        })
        if (mensaje == 'Error') {
            Swal.fire({
                "text": "No hay informacion asociada a esa cuenta",
                "icon": "info"
            })
            return null;
        } else {
            const dataToSend = {
                cuentaAsientos: cuentaAsientos,
                saldo_final: saldo_final
            };
            console.log("Cuenta asientos(desde la funcion): ",cuentaAsientos)
            console.log("saldo_final:  ", saldo_final)
            console.log("mensaje:  ", mensaje)
            return dataToSend;
        }
    
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