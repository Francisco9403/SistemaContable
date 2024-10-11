from datetime import datetime, timedelta
from decimal import Decimal
import json
from django.forms import IntegerField
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ObjectDoesNotExist
from login.models import AsientoCuenta, Cuentas, Asiento, AuthUser, Ventas, Clientes, Vendedores, VentaArticulo, Articulos
from django.db.models import F
from django.db.models import Sum


# REGISTRO DE ASIENTOS
@login_required(redirect_field_name="index.html")
def index(request):
    asientos = Asiento.objects.all()
    cuentas = Cuentas.objects.filter(recibe_saldo=True).order_by('codigo')
    user = request.user
    is_admin = user.is_superuser
    is_contador = user.groups.filter(name='Contadores').exists()
    print("asientos", asientos)
    print("cuentas", cuentas)
    return render(request,'login/index.html', {'cuentas': cuentas, 'asientos': asientos, 'is_admin': is_admin, 'is_contador': is_contador, 'is_detalles': True})


def login_user(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('lista_asientos')
        else:
            messages.success(request, "Usuario o contraseña incorrecto, por favor intente de nuevo")
            return redirect('login') ## LOGIN es como se llama la vista, en urls.py el path 'login_user' se llama LOGIN
    else:
        return render(request,'registration/login.html', {})
    

@require_http_methods(["GET","POST"])  # Limita la vista solo a solicitudes GET y POST
def obtener_proximo_id_asiento(request):
    try:
        proximo_id = Asiento.objects.latest('id').id + 1
    except ObjectDoesNotExist:        
        # Manejar el caso en el que no haya valores en la tabla 'Asiento'
        proximo_id = 1
    
    return JsonResponse({'proximo_id': proximo_id})

def get_nombre_cuenta(request):
    if request.method == "POST":
        data = json.loads(request.body)
        id_cuenta = data.get("id_cuenta")
        cuenta = Cuentas.objects.filter(id=id_cuenta)[0]
        nombre_cuenta = cuenta.nombre
        data = {
            'nombre': nombre_cuenta
        }
        return JsonResponse(data)

@login_required(redirect_field_name="index.html")
def registrar_cuentas_view(request):

    if request.method == "POST":
        codigo = request.POST['codigo']
        nombre = request.POST['nombre']
        tipo = request.POST['cuenta']
        recibe_saldo = request.POST.get('recibe_saldo', False)
        recibe_saldo = recibe_saldo = request.POST['recibe_saldo'] == "Si"

        if ( (not Cuentas.objects.filter(codigo=codigo).exists()) and (not Cuentas.objects.filter(nombre=nombre).exists())):

            nueva_cuenta = Cuentas(
                codigo=codigo,
                nombre=nombre,
                tipo=tipo,
                saldo=0,
                recibe_saldo=recibe_saldo
            )

            nueva_cuenta.save()
            print('request POST:' , request.POST)
            print('CUENTA: ', nueva_cuenta)            
            
            messages.success(request, 'Se registró la cuenta con éxito.')
            
        else:
            messages.error(request, 'No se pudo registrar la cuenta, el codigo o el nombre ya esta en uso.')
            
        return render(request, 'contador/registrar_cuentas.html')
    elif request.user.is_superuser or request.user.groups.filter(name='Contadores').exists():
        return render(request, 'contador/registrar_cuentas.html')
    else:
        return render(request, 'contador/nocontador.html')
    

def get_cuenta_by_id(id):
    return Cuentas.objects.filter(id=id)[0]

@require_http_methods(["GET","POST"])  # Limita la vista solo a solicitudes GET y POST
@login_required
def registrar_asiento(request):
    if request.method == 'POST':
        try:

            data = json.loads(request.body)
            
            print('data', data)

            user = request.user
            descripcion = data['descripcion']
            fecha = data['fecha']
            array_renglones = data['asientosToBackEnd']

            user = AuthUser.objects.get(username=user)
            new_asiento = Asiento.objects.create(descripcion=descripcion, id_usuario=user, fecha=fecha)

            for renglon in array_renglones:
                fecha = renglon.get("fecha")
                idCuenta = renglon.get("idCuenta")
                monto = renglon.get("monto")
                debeohaber = renglon.get("debeohaber")

                cuenta = get_cuenta_by_id(idCuenta)
                monto_decimal = Decimal(monto)

                if debeohaber == "debe":
                    debe_decimal = monto_decimal
                    haber_decimal = Decimal(0)
                else:
                    debe_decimal = Decimal(0)
                    haber_decimal = monto_decimal

                
                if cuenta.tipo == 'AC':
                    print("Saldo actual de la cuenta ", cuenta.nombre, ": ", cuenta.saldo)
                    cuenta.saldo += debe_decimal
                    cuenta.saldo -= haber_decimal
                    print("Saldo actual de la cuenta ", cuenta.nombre, "(actualizado): ", cuenta.saldo)

                if cuenta.tipo == 'PA':
                    cuenta.saldo += haber_decimal
                    cuenta.saldo -= debe_decimal
                
                if cuenta.tipo == 'R+':
                    cuenta.saldo += debe_decimal
                
                if cuenta.tipo == 'R-':
                    cuenta.saldo -= haber_decimal
                
                if cuenta.tipo == 'PM':
                    cuenta.saldo += haber_decimal
                    cuenta.saldo -= debe_decimal
                
                cuenta.save()
                new_renglon = AsientoCuenta.objects.create(id_cuenta=cuenta, id_asiento=new_asiento, debe=debe_decimal,
                                                        haber=haber_decimal, monto=monto, saldo_parcial=cuenta.saldo)
            
            data = {
                'titulo': '',
                'mensaje': 'Asiento registrado correctamente',
                'tipo': 'success'
                }
            return JsonResponse(data)
        except: 
            data = {
                'titulo': '',
                'mensaje': 'Error en el sistema, no se cargo el asiento correctamente',
                'tipo': 'error'
                }
            return JsonResponse(data)

    else:
        print('no llego el post')


@login_required(redirect_field_name="index.html")
def plan_cuentas_view(request):
    cuentas = Cuentas.objects.all().order_by('codigo')
    user = request.user
    is_admin = user.is_superuser
    is_contador = user.groups.filter(name='Contadores').exists()
    return render(request,'contador/plan_cuentas.html', {'cuentas': cuentas, 'is_admin': is_admin, 'is_contador': is_contador})

@login_required(redirect_field_name="index.html")    
def lista_asientos_view(request):
    asientos = Asiento.objects.all()
    return render(request,'contador/lista_asientos.html', {'asientos': asientos})

@login_required
def libro_diario_view(request):
    return render(request, 'contador/libro_diario.html')


@login_required
def libro_mayor_view(request):
    cuentas = Cuentas.objects.filter(recibe_saldo=True).order_by('codigo')
    return render(request, 'contador/libro_mayor.html',
        {'cuentas': cuentas})

def informe_ventas_view(request):
    vendedores = Vendedores.objects.all()
    ventas = Ventas.objects.all()

    if request.method == 'POST':
        start_date = request.POST.get('startDate')
        end_date = request.POST.get('endDate')
        
        # Filtrar ventas basadas en las fechas
        if start_date and end_date:
            ventas = Ventas.objects.filter(fecha__range=[start_date, end_date])

    return render(request,'ventas/informe_ventas.html', {'ventas': ventas, 'vendedores': vendedores})

@login_required(redirect_field_name="index.html")    
def AdministracionStock_view(request):
    articulos = Articulos.objects.all().order_by('id')
    return render(request,'ventas/AdministracionStock.html', {'articulos': articulos})


@login_required(redirect_field_name="index.html")    
def Administracion_clientes_view(request):
    clientes = Clientes.objects.all().order_by('id')
    return render(request,'ventas/Administracion_clientes.html', {'clientes': clientes})

@login_required(redirect_field_name="index.html")    
def Administracion_vendedores_view(request):
    vendedores = Vendedores.objects.all().order_by('id')
    return render(request,'ventas/Administracion_vendedores.html', {'vendedores': vendedores})



@login_required
def get_cuenta_asientos(request):                       #hay que corregir las fechas de la misma forma que en get get_asientos_filtrados
    result = json.loads(request.body)
    id_cuenta = result['id_cuenta']
    startDate = result['startDate']
    endDate = result['endDate']
    startDate = startDate.split("/")
    endDate = endDate.split("/")
    print('XXXXXXXXXXXXXXXX', startDate, endDate, type(startDate))
    fecha_inicio = str(datetime(int(startDate[2]), int(startDate[1]), int(startDate[0]))).split(" ")[0]
    fecha_final = str(datetime(int(endDate[2]), int(endDate[1]), int(endDate[0]))).split(" ")[0]
    cuenta = Cuentas.objects.filter(id=id_cuenta)[0]
    cuenta_asientos = AsientoCuenta.objects.filter(id_cuenta=id_cuenta)
    resultado = []
    

    # Caso de que con el id se haya encontrado la cuenta_asiento
    if len(cuenta_asientos) > 0:
        for x in cuenta_asientos:
            aux = []
            asiento_asociado = Asiento.objects.filter(fecha__gte=fecha_inicio, fecha__lte=fecha_final, id=x.id_asiento.id)
            if asiento_asociado:
                asiento_asociado = asiento_asociado[0]
                aux.append(asiento_asociado.fecha)
                aux.append(asiento_asociado.descripcion)
                aux.append(x.debe)
                aux.append(x.haber)
                aux.append(x.saldo_parcial) #por ahi se quita
                resultado.append(aux)
                print("AUUUUX", aux)
                data = {
                    'cuenta_asientos': resultado,
                    'saldo_final': cuenta.saldo,
                    'mensaje': "Exito..."
                }
            else:
                data = {
                    'cuenta_asientos': resultado,
                    'mensaje': "No hay asientos en esa fecha"
                }
                print("no hay asientos en esa fecha")
        
    else:
        data = {
            'mensaje': "Error"
        }

    print("resultado antes de enviar: ", resultado)
    return JsonResponse(data)


@login_required
def get_asientos_filtrados(request):
    result = json.loads(request.body)
    startDate = result['startDate']
    endDate = result['endDate']
    if startDate == 'Invalid Date':
        # # Obtén la fecha actual
        # fecha_actual = datetime.now()

        # # Calcula la fecha de inicio retrocediendo 7 días desde la fecha actual
        # fecha_inicio = fecha_actual - timedelta(days=7)

        # # Calcula la fecha de final como la fecha actual
        # fecha_final = fecha_actual
        # print("fecha invalida", str(fecha_inicio).split(" ")[0], str(fecha_final).split(" ")[0])
        resultados = Asiento.objects.all()
        asiento_cuenta_list = AsientoCuenta.objects.filter(id_asiento__in=resultados)


        asientos = [{'id': asiento.id, 'fecha': asiento.fecha, 'descripcion': asiento.descripcion} for asiento in resultados]
        asientoCuentas = [{'id_asiento': ac.id_asiento.id, 'id_cuenta': ac.id_cuenta.id, 'nombre_cuenta': ac.id_cuenta.nombre, 'debe': ac.debe, 'haber': ac.haber, 'monto': ac.monto, 'saldo_parcial': ac.saldo_parcial} for ac in asiento_cuenta_list]

        data = {
                'asientos': asientos,
                'asientoCuentas': asientoCuentas
            }
        return JsonResponse(data)
    else:
        startDate = startDate.split("/")
        endDate = endDate.split("/")
        fecha_inicio = str(datetime(int(startDate[2]), int(startDate[1]), int(startDate[0]))).split(" ")[0]
        fecha_final = str(datetime(int(endDate[2]), int(endDate[1]), int(endDate[0]))).split(" ")[0]
    
    
    print('XXXXXXXXXXXXXXXX', startDate, endDate, type(startDate))
    
    if fecha_inicio == fecha_final:
        fecha_igual = fecha_inicio
        print("la misma fecha", fecha_igual, type(fecha_igual))
        resultados = Asiento.objects.filter(fecha=fecha_igual)
    else:
        resultados = Asiento.objects.filter(fecha__gte=fecha_inicio, fecha__lte=fecha_final)
    
    print('XXXXXXXXXXXXXXXX RESULTADOS', resultados, fecha_inicio, fecha_final)
    asiento_cuenta_list = AsientoCuenta.objects.filter(id_asiento__in=resultados)


    asientos = [{'id': asiento.id, 'fecha': asiento.fecha, 'descripcion': asiento.descripcion} for asiento in resultados]
    asientoCuentas = [{'id_asiento': ac.id_asiento.id, 'id_cuenta': ac.id_cuenta.id, 'nombre_cuenta': ac.id_cuenta.nombre, 'debe': ac.debe, 'haber': ac.haber, 'monto': ac.monto, 'saldo_parcial': ac.saldo_parcial} for ac in asiento_cuenta_list]

    data = {
            'asientos': asientos,
            'asientoCuentas': asientoCuentas
        }
    return JsonResponse(data)



@login_required
def detalles_asiento_view(request, id):
    asiento = Asiento.objects.filter(id=id)
    asientos_cuenta = AsientoCuenta.objects.filter(id_asiento=id)
    cuentas = Cuentas.objects.all()
    return render(request,'login/index.html', {'cuentas': cuentas, 'asiento': asiento[0], "asientos_cuenta": asientos_cuenta, 'is_detalles': False})

@login_required
def factura_view(request, id):
    venta = Ventas.objects.filter(id=id)[0]
    venta_articulos = VentaArticulo.objects.filter(id_venta=id)
    return render(request,'contador/factura.html', {'venta': venta, 'venta_articulos': venta_articulos})


@login_required
def is_valid_saldo(request):
    result = json.loads(request.body)
    id_cuenta = result['id_cuenta']
    monto = result['monto']
    monto = float(monto)
    tipo_operacion = result['tipo_operacion']

    value = Cuentas.objects.filter(id=id_cuenta)

    # Caso de que con el id se haya encontrado la cuenta
    if len(value) > 0:
        if tipo_operacion == 'debe':
            if value[0].tipo == 'AC':
                # la cuenta es de activo y va por el debe
                data = {
                    'value': True,
                    'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo mayor a 0"
                }
            elif value[0].tipo == 'PA' or value[0].tipo == 'PM':
                # la cuenta es de pasivo y va por el debe
                # o
                # la cuenta es de patrimonio y va por el debe
                if (float(value[0].saldo) - monto) >= 0:
                    data = {
                        'value': True,
                        'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo mayor a 0"
                    }
                else:
                    data = {
                        'value': False,
                        'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo menor a 0"
                    }
            # elif value[0].tipo == 'PM':
            #     pass
            #     # la cuenta es de patrimonio y va por el debe
            elif value[0].tipo == 'R-':
                # la cuenta es de resultado + y va por el debe
                data = {
                    'value': True,
                    'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo mayor a 0"
                }
            elif value[0].tipo == 'R+':
                # la cuenta es de resultado - y va por el debe
                data = {
                    'value': False,
                    'mensaje': "La cuenta es de Positivo(R+), se registra por el haber"
                }

        else:  # tipo_operacion == 'haber'
            if value[0].tipo == 'AC':
                # la cuenta es de activo y va por el haber
                if (float(value[0].saldo) - monto) >= 0:
                    data = {
                        'value': True,
                        'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo mayor a 0"
                    }
                else:
                    data = {
                        'value': False,
                        'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo menor a 0"
                    }
            elif value[0].tipo == 'PA' or value[0].tipo == 'PM':
                # la cuenta es de pasivo y va por el haber
                # o
                # la cuenta es de patrimonio y va por el haber
                data = {
                    'value': True,
                    'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo mayor a 0"
                }
            # elif value[0].tipo == 'PM':
            #     pass
            #     # la cuenta es de patrimonio y va por el haber
            elif value[0].tipo == 'R-':
                # la cuenta es de resultado + y va por el haber
                data = {
                    'value': False,
                    'mensaje': "La cuenta es de Resultado Resultado Negativo(R-), se registra por el debe"
                }
            elif value[0].tipo == 'R+':
                # la cuenta es de resultado - y va por el haber
                data = {
                    'value': True,
                    'mensaje': "Comprobación realizada en el saldo de la cuenta, saldo mayor a 0"
                }

    else:
        # Caso de que con el id NO se haya encontrado la cuenta
        data = {
            'mensaje': "Error del sistema, cuenta no encontrada"
        }
        print("No fue posible realizar la comprobación")
    return JsonResponse(data)

@login_required
def registro_venta(request):
    clientes = Clientes.objects.all()
    vendedores = Vendedores.objects.all()
    articulos = Articulos.objects.all()
    return render(request, 'contador/registro_venta.html', {'clientes': clientes, 'vendedores': vendedores, 'articulos': articulos, 'is_detalles': True})

@require_http_methods(["GET","POST"])  # Limita la vista solo a solicitudes GET y POST
def obtener_proximo_id_venta(request):
    try:
        proximo_id = Ventas.objects.latest('id').id + 1
    except ObjectDoesNotExist:        
        # Manejar el caso en el que no haya valores en la tabla 'Asiento'
        proximo_id = 1
    
    return JsonResponse({'proximo_id': proximo_id})

def get_detalle_producto(request):
    if request.method == "POST":
        data = json.loads(request.body)
        id_producto = data.get("id_producto")
        producto = Articulos.objects.filter(id=id_producto)[0]
        data = {
            'nombre': producto.nombre,
            'precio': producto.precio,
            'stock': producto.cantidad
        }
        return JsonResponse(data)

def get_articulo_by_id(id):
    return Articulos.objects.filter(id=id)[0]


@require_http_methods(["GET","POST"])  # Limita la vista solo a solicitudes GET y POST
@login_required
def registrar_venta(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print('data', data)

            cliente = Clientes.objects.get(id=data['cliente'])
            fecha = data['fecha']
            formaPago = data['formaPago']
            monto_total_venta = data['monto_total_venta']
            vendedor = Vendedores.objects.get(id=data['vendedor'])
            descripcion = data['descripcion']
            array_productos = data['productos']

            new_venta = Ventas.objects.create(fecha=fecha, cliente=cliente, forma_pago=formaPago, monto_venta=monto_total_venta, descripcion=descripcion, vendedor=vendedor)
    
            ## Primer asiento (Venta)
            new_asiento_venta = Asiento.objects.create(
                descripcion=descripcion,
                id_usuario=AuthUser.objects.get(username=request.user),
                fecha=fecha,
                id_venta=new_venta
            )

            ## Primer Renglon venta
            if formaPago == "efectivo":
                ## efectivo, cuenta caja
                cuenta_debe = get_cuenta_by_id(3)
            else:
                ## tarjeta, cuenta banco
                cuenta_debe = get_cuenta_by_id(5)

            ## siempre es la misma, ventas
            cuenta_haber = get_cuenta_by_id(29)


            new_renglon_debe = AsientoCuenta.objects.create(id_cuenta=cuenta_debe, id_asiento=new_asiento_venta, debe=Decimal(monto_total_venta),
                                                    haber=Decimal(0), monto=monto_total_venta, saldo_parcial=cuenta_debe.saldo)
            
            ## Segundo Renglon venta

            new_renglon_haber = AsientoCuenta.objects.create(id_cuenta=cuenta_haber, id_asiento=new_asiento_venta, debe=Decimal(0),
                                                    haber=Decimal(monto_total_venta), monto=monto_total_venta, saldo_parcial=cuenta_haber.saldo)
            
            print("new_venta", new_venta)

            monto_total_venta_mercaderia = 0

            for producto in array_productos:
                idArticulo = producto.get("producto_id")
                precio_unitario = producto.get("precio_unitario")
                cantidad = int(producto.get("cantidad"))
                subtotal = int(producto.get('subtotal'))
                articulo = get_articulo_by_id(idArticulo)
                
                monto_total_venta_mercaderia += cantidad * articulo.costo 

                articulo.cantidad -= cantidad
                articulo.save()               
                new_venta_articulo = VentaArticulo.objects.create(id_venta=new_venta, id_articulo=articulo, precio=precio_unitario, cantidad=cantidad, precio_parcial=subtotal)
                print("new_venta_articulo", new_venta_articulo)

            
            ## Segundo asiento (Mercaderia)
            new_asiento_mercaderia = Asiento.objects.create(
                descripcion="Asiento para registrar el egreso de la mercaderia generado automaticamente",
                id_usuario=AuthUser.objects.get(username=request.user),
                fecha=fecha,
                id_venta=new_venta
            )

            ## Primer Renglon venta
            ## siempre es la misma, CMV

            cuenta_debe = get_cuenta_by_id(33)

            ## siempre es la misma, mercaderias
            cuenta_haber = get_cuenta_by_id(11)


            new_renglon_debe = AsientoCuenta.objects.create(id_cuenta=cuenta_debe, id_asiento=new_asiento_mercaderia, debe=Decimal(monto_total_venta_mercaderia),
                                                    haber=Decimal(0), monto=monto_total_venta_mercaderia, saldo_parcial=cuenta_debe.saldo)
            
            ## Segundo Renglon venta

            new_renglon_haber = AsientoCuenta.objects.create(id_cuenta=cuenta_haber, id_asiento=new_asiento_mercaderia, debe=Decimal(0),
                                                    haber=Decimal(monto_total_venta_mercaderia), monto=monto_total_venta_mercaderia, saldo_parcial=cuenta_haber.saldo)


            data = {
                'titulo': '',
                'mensaje': 'Venta registrada correctamente',
                'tipo': 'success'
                }
            return JsonResponse(data)
        except Exception as e:
            print("Algo fallo")
            print(e) 
            data = {
                'titulo': '',
                'mensaje': 'Error en el sistema, no se cargo la venta correctamente',
                'tipo': 'error'
                }
            return JsonResponse(data)

    else:
        print('no llego el post')


@login_required(redirect_field_name="AdministracionStock.html")
def registrar_productos_view(request):

    if request.method == "POST":
        try:
            descripcion = request.POST['descripcion']
            nombre = request.POST['nombre']
            precio = request.POST['precio']
            precio_costo = request.POST['precio_costo']
            impuesto = request.POST['impuesto']
            cantidad = request.POST['cantidad']

            precio_con_impuesto = int(precio)+((int(precio)*int(impuesto))/100)


            nuevo_producto = Articulos(
                descripcion=descripcion,
                nombre=nombre,
                precio=precio_con_impuesto,
                cantidad=cantidad,
                costo=precio_costo,
                impuesto=impuesto
            )

            nuevo_producto.save()
            print('request POST:' , request.POST)
            print('PRODUCTO: ', nuevo_producto)            
            
            messages.success(request, 'Se registró el producto con éxito.')
                
            return render(request, 'ventas/registro_producto.html')
        except:
            messages.error(request, 'No se pudo registrar el producto, por favor revise los campos')
            return render(request, 'ventas/registro_producto.html')
    else:
        return render(request, 'ventas/registro_producto.html')
    

@login_required(redirect_field_name="Administracion_clientes.html")
def registrar_clientes_view(request):

    if request.method == "POST":
        try:
            nombre = request.POST['nombre']
            dni = request.POST['dni']
            direccion = request.POST['direccion']
            contacto = request.POST['contacto']


            nuevo_cliente = Clientes(
                nombre_del_cliente=nombre,
                direccion=direccion,
                dni=dni,
                contacto=contacto
            )

            nuevo_cliente.save()
            print('request POST:' , request.POST)
            print('CLIENTE: ', nuevo_cliente)            
            
            messages.success(request, 'Se registró el cliente con éxito.')
                
            return render(request, 'ventas/registro_clientes.html')
        except:
            messages.error(request, 'No se pudo registrar el cliente, por favor revise los campos')
            return render(request, 'ventas/registro_clientes.html')
    else:
        return render(request, 'ventas/registro_clientes.html')
    
@login_required(redirect_field_name="Administracion_vendedores.html")
def registrar_vendedores_view(request):

    if request.method == "POST":
        nombre = request.POST['nombre']
        dni = request.POST['dni']
        contacto = request.POST['contacto']


        nuevo_vendedor = Vendedores(
            nombre=nombre,
            dni=dni,
            contacto=contacto
        )

        nuevo_vendedor.save()
        print('request POST:' , request.POST)
        print('VENDEDOR: ', nuevo_vendedor)            
        
        messages.success(request, 'Se registró el vendedor con éxito.')
            
        return render(request, 'ventas/registro_vendedores.html')
    elif request.user.is_superuser or request.user.groups.filter(name='Contadores').exists():
        return render(request, 'ventas/registro_vendedores.html')
    else:
        return render(request, 'contador/nocontador.html')
    

@login_required(redirect_field_name="Actualizar_stock.html")
def actualizar_stock_view(request):
    articulos = Articulos.objects.all().order_by('id')
    return render(request, 'ventas/Actualizar_stock.html', {'articulos': articulos})


def editar_articulo_view(request, articulo_id):
    articulo = get_object_or_404(Articulos, id=articulo_id)
    
    if request.method == 'POST': 

        precio = request.POST.get('precio', 0)

        impuesto = request.POST.get('impuesto', 0)

        precio_con_impuesto = int(precio)+((int(precio)*int(impuesto))/100)

        # Actualizar los campos del artículo con los datos del formulario
        articulo.descripcion = request.POST.get('descripcion', '')
        articulo.precio = precio_con_impuesto
        articulo.nombre = request.POST.get('nombre', '')
        articulo.cantidad = request.POST.get('cantidad', 0)
        articulo.impuesto = impuesto
        # Guardar los cambios en la base de datos
        articulo.save()
        # Redireccionar a alguna página de confirmación o a donde desees
        return redirect('AdministracionStock')  # Reemplaza 'pagina_de_confirmacion' con el nombre de la URL
        
    return render(request, 'ventas/editar_articulo.html', {'articulo': articulo})

def analisis_ventas(request):
    # Retrieve data from models
    articulos = Articulos.objects.all()
    clientes = Clientes.objects.all()
    vendedores = Vendedores.objects.all()
    ventas = Ventas.objects.all()

    # Query sets for analytics
    top_selling_products = VentaArticulo.objects.values('id_articulo__nombre').annotate(total_qty=Sum('cantidad')).order_by('-total_qty')[:5]
    top_revenue_products = VentaArticulo.objects.values('id_articulo__nombre').annotate(total_revenue=Sum('precio_parcial')).order_by('-total_revenue')[:5]
    top_selling_employees = Ventas.objects.values('vendedor__nombre').annotate(total_revenue=Sum('monto_venta')).order_by('-total_revenue')[:5]
    top_buyers = Ventas.objects.values('cliente').annotate(total_spent=Sum('monto_venta')).order_by('-total_spent')[:5]

    # Convert QuerySet to list of dictionaries
    top_selling_products_list = list(top_selling_products)
    top_revenue_products_list = list(top_revenue_products)
    top_selling_employees_list = list(top_selling_employees)
    top_buyers_list = list(top_buyers)

    # Convert lists to JSON
    top_selling_products_json = json.dumps(top_selling_products_list)
    top_revenue_products_json = json.dumps(top_revenue_products_list)
    top_selling_employees_json = json.dumps(top_selling_employees_list)
    top_buyers_json = json.dumps(top_buyers_list)

    print(top_buyers_json)

    return render(request, 'ventas/analisis_ventas.html', {
        'top_selling_products_json': top_selling_products_json,
        'top_revenue_products_json': top_revenue_products_json,
        'top_selling_employees_json': top_selling_employees_json,
        'top_buyers_json': top_buyers_json,
        'articulos': articulos,
        'clientes': clientes,
        'vendedores': vendedores,
        'ventas': ventas
    })

