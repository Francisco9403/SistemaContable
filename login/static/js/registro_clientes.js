document.addEventListener('DOMContentLoaded', function() {
    const nombre = document.getElementById("nombre");
    const dni = document.getElementById("dni");
    const direccion = document.getElementById("direccion");
    const contacto = document.getElementById("contacto");
    const registrar = document.getElementById("registrar");

    registrar.addEventListener('click', function(event) {
        
        if (nombre.value === "" || dni.value === "" || dni.value <= 0 || direccion.value === "" || contacto.value === "") {
            event.preventDefault();
            Swal.fire({
                "text": "Revise que los campos esten correctos",
                "icon": "warning"
            })
        }
    })

})
