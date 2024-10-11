# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Articulos(models.Model):
    descripcion = models.TextField(blank=True, null=True)
    precio = models.IntegerField()
    nombre = models.TextField()
    cantidad = models.IntegerField()
    costo = models.IntegerField()
    impuesto = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'Articulos'


class Asiento(models.Model):
    fecha = models.TextField()
    id_usuario = models.ForeignKey('AuthUser', models.DO_NOTHING, db_column='id_usuario')
    descripcion = models.TextField()
    id_venta = models.ForeignKey('Ventas', models.DO_NOTHING, db_column='id_venta', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Asiento'


class AsientoCuenta(models.Model):
    id_asiento = models.ForeignKey(Asiento, models.CASCADE, db_column='id_asiento')
    id_cuenta = models.ForeignKey('Cuentas', models.CASCADE, db_column='id_cuenta')
    debe = models.TextField()  # This field type is a guess.
    haber = models.TextField()  # This field type is a guess.
    monto = models.TextField()  # This field type is a guess.
    saldo_parcial = models.TextField()  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'Asiento_Cuenta'


class Clientes(models.Model):
    nombre_del_cliente = models.TextField()
    direccion = models.TextField(blank=True, null=True)
    dni = models.IntegerField(unique=True)
    contacto = models.TextField()

    class Meta:
        managed = False
        db_table = 'Clientes'


class Cuentas(models.Model):
    codigo = models.IntegerField(unique=True)
    nombre = models.TextField()
    tipo = models.TextField()
    saldo = models.IntegerField()  # This field type is a guess.
    recibe_saldo = models.BooleanField()  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'Cuentas'


class Emisor(models.Model):
    nombre = models.TextField()
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Emisor'


class Factura(models.Model):
    numero_factura = models.IntegerField(unique=True)
    venta = models.ForeignKey('Ventas', models.DO_NOTHING, db_column='venta')
    cliente = models.ForeignKey(Clientes, models.DO_NOTHING, db_column='cliente')
    fecha = models.TextField()
    tipo_factura = models.TextField()

    class Meta:
        managed = False
        db_table = 'Factura'


class Nota(models.Model):
    tipo_nota = models.TextField()
    monto = models.TextField()  # This field type is a guess.
    fecha_emision = models.TextField()
    numero_nota = models.IntegerField()
    id_emisor = models.ForeignKey(Emisor, models.DO_NOTHING, db_column='id_emisor')
    id_receptor = models.ForeignKey('Receptor', models.DO_NOTHING, db_column='id_receptor')
    numero_factura = models.ForeignKey(Factura, models.DO_NOTHING, db_column='numero_factura', to_field='numero_factura')
    descripcion = models.IntegerField(blank=True, null=True)
    monto_total = models.TextField()  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'Nota'


class Receptor(models.Model):
    nombre = models.TextField()
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Receptor'


class Vendedores(models.Model):
    nombre = models.TextField()
    dni = models.IntegerField()
    contacto = models.TextField()

    class Meta:
        managed = False
        db_table = 'Vendedores'


class VentaArticulo(models.Model):
    id_venta = models.ForeignKey('Ventas', models.DO_NOTHING, db_column='id_venta')
    id_articulo = models.ForeignKey(Articulos, models.DO_NOTHING, db_column='id_articulo')
    precio = models.TextField()  # This field type is a guess.
    cantidad = models.IntegerField()
    precio_parcial = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'Venta_Articulo'


class Ventas(models.Model):
    fecha = models.TextField()
    cliente = models.ForeignKey(Clientes, models.DO_NOTHING, db_column='cliente')
    forma_pago = models.TextField()
    monto_venta = models.TextField()  # This field type is a guess.
    descripcion = models.TextField(blank=True, null=True)
    vendedor = models.ForeignKey(Vendedores, models.DO_NOTHING, db_column='vendedor')

    class Meta:
        managed = False
        db_table = 'Ventas'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)
    name = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()
    first_name = models.CharField(max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class DjangoAdminLog(models.Model):
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    action_time = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'
