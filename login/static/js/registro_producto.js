document.addEventListener('DOMContentLoaded', function() {
    const nombre = document.getElementById("nombre");
    const descripcion = document.getElementById("descripcion");
    const precio_venta = document.getElementById("precio");
    const precio_costo = document.getElementById("precio_costo");
    const impuesto = document.getElementById("impuesto");
    const cantidad = document.getElementById("cantidad");
    const registrar = document.getElementById("registrar");

    const precioBaseInput = document.getElementById('precio');
    const impuestoInput = document.getElementById('impuesto');
    const precioFinalInput = document.getElementById('precio_final');

    const calcularPrecioFinal = () => {
    const precioBase = parseFloat(precioBaseInput.value);
    const impuesto = parseFloat(impuestoInput.value);
    const precioFinal = precioBase * (1 + impuesto / 100);
    precioFinalInput.value = precioFinal.toFixed(2);
    };

    document.getElementById('calcular_precio').addEventListener('click', calcularPrecioFinal);

    registrar.addEventListener('click', function(event) {
        
        if (nombre.value === "" || descripcion.value === "" || precio_venta.value === "" || precio_venta.value <= 0 || precio_costo.value === "" || precio_costo.value <= 0 ||  cantidad.value === "" || cantidad.value <= 0 || impuesto.value === "" || impuesto.value <= 0) {
            event.preventDefault();
            Swal.fire({
                "text": "Revise que los campos esten correctos",
                "icon": "warning"
            })
        }
    })

})
