module.exports = function(app, swig, gestorBD) {

    app.post('/comentarios/:cancion_id', function (req, res) {
            if ( req.session.usuario == null){
                res.redirect("/tienda");
                return;
            }

            let comentario = {
                autor : req.session.usuario,
                texto : req.body.texto,
                cancion_id : gestorBD.mongo.ObjectID(req.params.cancion_id),
            }

            // Conectarse
            gestorBD.insertarComentario(comentario, function(id){
                if (id == null) {
                    res.send("Error al insertar comentario");
                } else {
                    res.send("Agregada id: "+ id);
                }
            });
        })
}