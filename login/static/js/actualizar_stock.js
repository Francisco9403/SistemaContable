document.addEventListener('DOMContentLoaded', async function () {
    document.getElementById("form_actualizar_stock").addEventListener("submit", function(event) {
        event.preventDefault();

        var selectedValue = document.getElementById("articulo").value;
        var newAction = "/accounts/editar_articulo/" + selectedValue;    
        
        this.setAttribute("action", newAction);
        this.submit();
    });
})