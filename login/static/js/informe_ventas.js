document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterButton = document.getElementById('filterButton');
    const filterForm = document.getElementById('filterForm');

    filterButton.addEventListener('click', function() {
        const startDateString = startDateInput.value;
        const endDateString = endDateInput.value;
    
        // Verificar si ambas fechas han sido seleccionadas
        if (startDateString === '' || endDateString === '') {
            Swal.fire({
                text: "Debes seleccionar ambas fechas.",
                icon: "info"
            });
            return; // Salir de la función si falta alguna fecha
        }
    
        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);
        const today = new Date();
    
        // Verificar si las fechas son válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            Swal.fire({
                text: "Las fechas seleccionadas son inválidas.",
                icon: "info"
            });
            return; // Salir de la función si alguna fecha es inválida
        }
    
        // Verificar si las fechas son mayores que el día de hoy
        if (startDate > today || endDate > today) {
            Swal.fire({
                text: "No puedes seleccionar una fecha mayor que el día de hoy.",
                icon: "info"
            });
            return; // Salir de la función si alguna fecha es mayor que hoy
        }
    
        // Verificar si la fecha de inicio es mayor que la fecha final
        if (startDate > endDate) {
            Swal.fire({
                text: "La fecha de inicio no puede ser mayor que la fecha final.",
                icon: "info"
            });
            return; // Salir de la función si la fecha de inicio es mayor
        }
    
        // Si todo está bien, enviar el formulario
        filterForm.submit();
    });
});
