module.exports = function(app, swig) {
    app.get("/autores", function(req, res) {
        let autores = [{
            "nombre" : "alguien1",
            "grupo" : "ACDC",
            "rol" : "cantante"
        }, {
            "nombre" : "alguien2",
            "grupo" : "Queen",
            "rol" : "teclista"
        }, {
            "nombre" : "alguien3",
            "grupo" : "BTS",
            "rol" : "guitarrista"
        }];

        let respuesta = swig.renderFile('views/autores.html', {
            autores : autores
        });

        res.send(respuesta);
    });

    app.get('/autores/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/autores-agregar.html', {

        });
        res.send(respuesta);
    })

    app.post("/autor", function (req, res) {
        let nombre = "";
        let grupo = "";
        let rol = "";

        if(typeof (req.body.nombre) != "undefined" )
            nombre = "Autor agregado:"+req.body.nombre + "<br>"
        else
            nombre = "autor no enviado" + "<br>"
        if(typeof (req.body.grupo) != "undefined" )
            grupo = " grupo :" +  req.body.grupo + "<br>"
        else
            grupo = "grupo no enviado" + "<br>"
        if(typeof (req.body.rol) != "undefined" )
            rol = " rol: " + req.body.rol;
        else
            rol = "rol no enviado" + "<br>"

        res.send(nombre + grupo + rol);
    })
};