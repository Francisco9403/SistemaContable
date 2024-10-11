document.addEventListener('DOMContentLoaded', async function () {
    document.getElementById("formEditarArticulo").addEventListener("submit", function(event) {
        const precio = document.getElementById("precio").value;
        const descripcion = document.getElementById("descripcion").value;
        const cantidad = document.getElementById("cantidad").value;

        if (precio <= 0 || cantidad <= 0 || descripcion.trim() == "") {
            event.preventDefault();
            Swal.fire({
                "text": "Revise que los campos esten correctos",
                "icon": "warning"
            })
        }
    });
})