module.exports = function(app, gestorBD) {

    function esPropietario(id, usuario, funcionCallback) {
        let criterio = { "_id" : gestorBD.mongo.ObjectID(id) };
        console.log(id)
        console.log(usuario)
        gestorBD.obtenerCanciones(criterio,function(canciones){
            if ( canciones == null ) {
                res.send(respuesta);
            } else {
                let criterio = {"usuario" : usuario};
                gestorBD.obtenerCompras(criterio, function (compras) {
                    if (compras == null) {
                        res.send("Error al listar");
                    } else {
                        if (canciones[0].autor.toString() == usuario.toString())
                            funcionCallback(true);
                        for (i = 0; i < compras.length; i++) {
                            if (compras[i].cancionId.toString() === gestorBD.mongo.ObjectID(id).toString()) {
                                funcionCallback(true);
                            }
                        }
                    }
                })
            }
        })
    }

    app.get("/api/cancion", function(req, res) {
        gestorBD.obtenerCanciones( {} , function(canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send( JSON.stringify(canciones) );
            }
        });
    });

    app.get("/api/cancion/:id", function(req, res) {
        var criterio = { "_id" : gestorBD.mongo.ObjectID(req.params.id)}

        gestorBD.obtenerCanciones(criterio,function(canciones){
            if ( canciones == null ){
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send( JSON.stringify(canciones[0]) );
            }
        });
    });

    app.delete("/api/cancion/:id", function(req, res) {
        var criterio = { "_id" : gestorBD.mongo.ObjectID(req.params.id)}

        var token = req.headers['token'] || req.body.token || req.query.token;
        var usuario
        if (token != null) {
            // verificar el token
            app.get('jwt').verify(token, 'secreto', function (err, infoToken) {
                if (err || (Date.now() / 1000 - infoToken.tiempo) > 240) {
                    res.status(403); // Forbidden
                    res.json({
                        acceso: false,
                        error: 'Token invalido o caducado'
                    });
                    // También podríamos comprobar que intoToken.usuario existe
                    return;

                } else {
                    // dejamos correr la petición
                    usuario = infoToken.usuario;
                }
            });
        }

        esPropietario(gestorBD.mongo.ObjectID(req.params.id).toString(), usuario, function (esPropietario) {
            if(esPropietario==false) {
                res.status(500);
                res.json({
                    error: "no eres el propietario de la cancion"
                });
            } else {
                gestorBD.eliminarCancion(criterio, function (canciones) {
                    if (canciones == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(canciones));
                    }
                });
            }
        })
    });

    app.post("/api/cancion", function(req, res) {
        var cancion = {
            nombre : req.body.nombre,
            genero : req.body.genero,
            precio : req.body.precio,
        }
        // ¿Validar nombre, genero, precio?
        if(validate(req, res, cancion)) {
            gestorBD.insertarCancion(cancion, function (id) {
                if (id == null) {
                    res.status(500);
                    res.json({
                        error: "se ha producido un error"
                    })
                } else {
                    res.status(201);
                    res.json({
                        mensaje: "canción insertarda",
                        _id: id
                    })
                }
            });
        }
    });

    app.put("/api/cancion/:id", function(req, res) {

        let criterio = { "_id" : gestorBD.mongo.ObjectID(req.params.id) };

        let cancion = {}; // Solo los atributos a modificar

        var token = req.headers['token'] || req.body.token || req.query.token;
        var usuario
        if (token != null) {
            // verificar el token
            app.get('jwt').verify(token, 'secreto', function (err, infoToken) {
                if (err || (Date.now() / 1000 - infoToken.tiempo) > 240) {
                    res.status(403); // Forbidden
                    res.json({
                        acceso: false,
                        error: 'Token invalido o caducado'
                    });
                    // También podríamos comprobar que intoToken.usuario existe
                    return;

                } else {
                    // dejamos correr la petición
                    usuario = infoToken.usuario;
                }
            });
        }
        if(validate(req, res, cancion)) {
            esPropietario(gestorBD.mongo.ObjectID(req.params.id).toString(), usuario, function (esPropietario) {
                if(esPropietario==false) {
                    res.status(500);
                    res.json({
                        error: "no eres el propietario de la cancion"
                    });
                } else {
                    gestorBD.modificarCancion(criterio, cancion, function (result) {
                        if (result == null) {
                            res.status(500);
                            res.json({
                                error: "se ha producido un error"
                            })
                        } else {
                            res.status(200);
                            res.json({
                                mensaje: "canción modificada",
                                _id: req.params.id
                            })
                        }
                    });
                }
            })
        }
    });

    app.post("/api/autenticar/", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');

        let criterio = {
            email : req.body.email,
            password : seguro
        }

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if(usuarios==null || usuarios.length == 0){
                res.status(401);
                res.json({autenticado : false})
            } else{
                var token = app.get('jwt').sign(
                    {usuario: criterio.email , tiempo: Date.now()/1000},
                    "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token : token
                })
            }
        })
    });

    function validate(req, res, cancion) {
        if ( req.body.nombre != null && req.body.nombre.length>5)
            cancion.nombre = req.body.nombre;
        else{
            res.status(500);
            res.json({
                error : "nombre vacio o logitud menor que 5"
            })
            return false;
        }
        if ( req.body.genero != null && req.body.genero.length>3)
            cancion.genero = req.body.genero;
        else{
            res.status(500);
            res.json({
                error : "genero vacio o longitud menor que 3"
            })
            return false;
        }
        if ( req.body.precio != null && req.body.precio>=0)
            cancion.precio = req.body.precio;
        else{
            res.status(500);
            res.json({
                error : "precio vacio o precio negativo"
            })
            return false;
        }

        return true;
    }
}