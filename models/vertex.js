var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./api.properties');

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
    transport : function(data) {
        //console.log(data.output);
        fs.open(properties.get('main.log.file'), 'a', 0666, function(e, id) {
            fs.write(id, data.output+"\n", null, 'utf8', function() {
                fs.close(id, function() {
                });
            });
        });
    }
});

var dbConfig = {
  host: properties.get('bbdd.mysql.ip') ,
  user: properties.get('bbdd.mysql.user') ,
  password: properties.get('bbdd.mysql.passwd') ,
  database: properties.get('bbdd.mysql.name'),
    connectionLimit: 50,
    queueLimit: 0,
    waitForConnection: true
};

var mysql = require('mysql');

// Crear la conexion a la base de datos
var connection = mysql.createPool(dbConfig);

// Crear un objeto para ir almacenando todo lo necesario
var vertexModel = {};

// Convertir grados en grados y minutos
function kcoords(px, py) {
    var x  = Math.abs(px);
    var dx = Math.floor(x);
    var mx = Math.floor((x - dx)*60);
    var sx = Math.floor(((x - dx) - (mx/60))*3600);
    if (px < 0) dx = -dx;
    var y  = Math.abs(py);
    var dy = Math.floor(y);
    var my = Math.floor((y - dy)*60);
    var sy = Math.floor(((y - dy) - (my/60))*3600);
    if (py < 0) dy = -dy;
    return (dx + '|' + (mx+sx/60) + ',' + dy + '|' + (my+sy/60));
}

// Obtener todos las vertices de una area
vertexModel.getVertexesArea = function(id, startRow, endRow, sortBy, callback)
{
  if (connection)
  {
    var sqlCount = 'SELECT count(*) as nrows FROM VERTEX WHERE AREA_ID = ' + connection.escape(id);
    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = 'SELECT ID as id, AREA_ID as areaId, DESCRIPTION as description, NUM_VERTEX as numVertex, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude FROM VERTEX WHERE AREA_ID = ' + connection.escape(id);

        var totalRows = row[0].nrows;

        var sql = '';
        var orderBy = '';

        if (sortBy == null) {
          orderBy = 'id';
        }
        else {
          vsortBy = sortBy.split(',');
          for (var i=0; i<vsortBy.length; i++ ) {
            if (vsortBy[i].charAt(0) == '-') {
              var element = vsortBy[i].substring(1, vsortBy[i].length);
              if (element == 'id' || element == 'description' || element == 'numVertex' || element == 'longitude' || element == 'latitude')
              {
                if (orderBy == '')
                  orderBy = element + ' desc';
                else
                  orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'description' || element == 'numVertex' || element == 'longitude' || element == 'latitude')
              {
                if (orderBy == '')
                  orderBy = element;
                else
                  orderBy = orderBy + ',' + element;
              }
            }
          }
        }

        if (orderBy == '') {
          orderBy = 'id';
        }

        if (startRow == null || endRow == null) {
          sql = consulta + " ORDER BY " + orderBy;
        }
        else {
          sql = consulta + " ORDER BY " + orderBy + " LIMIT " + (endRow - startRow + 1) + " OFFSET " + startRow;
        }

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, rows)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                callback(null, rows, totalRows);
            }
        });
      }
      else
      {
        callback(null,[]);
      }
    });
  }
  else {
    callback(null, null);
  }
}

// Obtener todos las vertices
vertexModel.getVertexes = function(startRow, endRow, sortBy, callback)
{
  if (connection)
  {
    var sqlCount = 'SELECT count(*) as nrows FROM VERTEX';
    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = 'SELECT ID as id, AREA_ID as areaId, DESCRIPTION as description, NUM_VERTEX as numVertex, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude FROM VERTEX'

        var totalRows = row[0].nrows;

        var sql = '';
        var orderBy = '';

        if (sortBy == null) {
          orderBy = 'id';
        }
        else {
          vsortBy = sortBy.split(',');
          for (var i=0; i<vsortBy.length; i++ ) {
            if (vsortBy[i].charAt(0) == '-') {
              var element = vsortBy[i].substring(1, vsortBy[i].length);
              if (element == 'id' || element == 'areaId' || element == 'description' || element == 'numVertex' || element == 'longitude' || element == 'latitude')
              {
                if (orderBy == '')
                  orderBy = element + ' desc';
                else
                  orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'areaId' || element == 'description' || element == 'numVertex' || element == 'longitude' || element == 'latitude')
              {
                if (orderBy == '')
                  orderBy = element;
                else
                  orderBy = orderBy + ',' + element;
              }
            }
          }
        }

        if (orderBy == '') {
          orderBy = 'id';
        }

        if (startRow == null || endRow == null) {
          sql = consulta + " ORDER BY " + orderBy;
        }
        else {
          sql = consulta + " ORDER BY " + orderBy + " LIMIT " + (endRow - startRow + 1) + " OFFSET " + startRow;
        }

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, rows)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                callback(null, rows, totalRows);
            }
        });
      }
      else
      {
        callback(null,[]);
      }
    });
  }
  else {
    callback(null, null);
  }

}

// Obtener un vertice por su id
vertexModel.getVertex = function(id,callback)
{
    if (connection)
    {
        var sql = 'SELECT ID as id, DESCRIPTION as description, AREA_ID as areaId, NUM_VERTEX as numVertex, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude FROM VERTEX WHERE id = ' + connection.escape(id);
        log.debug ("Query: "+sql);
        connection.query(sql, function(error, row)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                callback(null, row);
            }
        });
    } else {
      callback(null, null);
    }
}

// Actualizar un vertice
vertexModel.updateVertex = function(vertexData, callback)
{
    var coordenadas = kcoords(vertexData.latitude, vertexData.longitude);
    var lat = coordenadas.substring(0, coordenadas.indexOf(','));
    var lon = coordenadas.substring(coordenadas.indexOf(',')+1, coordenadas.length);
    var latdeg = lat.substring(0, lat.indexOf('|'));
    var latmin = lat.substring(lat.indexOf('|')+1, lat.length);
    var londeg = lon.substring(0, lon.indexOf('|'));
    var lonmin = lon.substring(lon.indexOf('|')+1, lon.length);

    if(connection)
    {
        var sql = 'UPDATE VERTEX SET DESCRIPTION = ' + connection.escape(vertexData.description) + ',' +
        'AREA_ID = ' + connection.escape(vertexData.areaId) + ',' +
        'NUM_VERTEX = ' + connection.escape(vertexData.numVertex) + ',' +
        'POS_LATITUDE_DEGREE = ' + latdeg + ',' +
        'POS_LATITUDE_MIN = ' + latmin + ',' +
        'POS_LONGITUDE_DEGREE = ' + londeg + ',' +
        'POS_LONGITUDE_MIN = ' + londeg + ' ' +
        'WHERE id = ' + vertexData.id;

        log.debug ("Query: "+sql);
        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(error, null);
            }
            else
            {
                callback(null,{"message":"success"});
            }
        });
    } else {
      callback(null, null);
    }

}

//añadir una nuevo vertice
vertexModel.insertVertex = function(vertexData,callback)
{
    var coordenadas = kcoords(vertexData.latitude, vertexData.longitude);
    var lat = coordenadas.substring(0, coordenadas.indexOf(','));
    var lon = coordenadas.substring(coordenadas.indexOf(',')+1, coordenadas.length);
    var latdeg = lat.substring(0, lat.indexOf('|'));
    var latmin = lat.substring(lat.indexOf('|')+1, lat.length);
    var londeg = lon.substring(0, lon.indexOf('|'));
    var lonmin = lon.substring(lon.indexOf('|')+1, lon.length);

    if (connection)
    {
        var sql = 'INSERT INTO VERTEX SET DESCRIPTION = ' + connection.escape(vertexData.description) + ',' +
        'AREA_ID = ' + connection.escape(vertexData.areaId) + ',' +
        'NUM_VERTEX = ' + connection.escape(vertexData.numVertex) + ',' +
        'POS_LATITUDE_DEGREE = ' + latdeg + ',' +
        'POS_LATITUDE_MIN = ' + latmin + ',' +
        'POS_LONGITUDE_DEGREE = ' + londeg + ',' +
        'POS_LONGITUDE_MIN = ' + lonmin;

        log.debug ("Query: "+sql);
        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(error, null);
            }
            else
            {
                //devolvemos la última id insertada
                callback(null,{"insertId" : result.insertId});
            }
        });
    }
    else {
      callback(null, null);
    }
}

// Eliminar un vertice pasando la id a eliminar
vertexModel.deleteVertex = function(id, callback)
{
    if(connection)
    {
        var sqlExists = 'SELECT ID as id, DESCRIPTION as description, AREA_ID as areaId, NUM_VERTEX as numVertex, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude FROM VERTEX WHERE id = ' + connection.escape(id);
        log.debug ("Query: "+sqlExists);
        connection.query(sqlExists, function(err, row) {
            //si existe la id del vertice a eliminar
            if(row)
            {
                var sql = 'DELETE FROM VERTEX WHERE id = ' + connection.escape(id);

                log.debug ("Query: "+sql);

                connection.query(sql, function(error, result)
                {
                    if(error)
                    {
                      callback(error, null);
                    }
                    else
                    {
                      // se devuelven los datos del elemento eliminado
                      callback(null,row);
                    }
                });
            } else {
                callback(null,{"message":"notExist"});
            }
        });
    }
    else {
      callback(null, null);
    }
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = vertexModel;
