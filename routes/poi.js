var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var UxoModel = require('../models/poi');

// Fichero de propiedades
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

/**
* @apiDefine LoginError
*
* @apiError UserNotFound The id of the User was not found
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Invalid user or password"
*      }
*     }
*/

/**
* @apiDefine PermissionError
*
* @apiError NotAllow Access not allow to User
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -4,
*        "description": "User not authorized"
*      }
*     }
*/

/** @apiDefine TokenError
*
* @apiError TokenInvalid The token is invalid
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Invalid token"
*      }
*     }
*/

/** @apiDefine TokenExpiredError
*
* @apiError TokenExpired The token is expired
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Token expired"
*      }
*     }
*/

/** @apiDefine MissingParameterError
*
* @apiError MissingParameter Missing parameter
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -4,
*        "description": "Missing parameter"
*      }
*     }
*/

/** @apiDefine MissingRegisterError
*
* @apiError MissingRegister Missing register
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -1000,
*        "description": "Missing element"
*      }
*     }
*/

/** @apiDefine IdNumericError
*
* @apiError IdNumeric Id numeric error
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -9,
*        "description": "The id must be numeric"
*      }
*     }
*/

/** @apiDefine TokenHeader
*
* @apiHeader {String} x-access-token JSON Web Token (JWT)
*
* @apiHeaderExample {json} Header-Example:
*     {
*       "x-access-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzIyMTg2ODc1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9._tYZLkBrESt9FwOccyvripIsZR5S0m8PLZmEgIDEFaY"
*     }
*/

/* POST. Obtenemos y mostramos todos los UXO */
/**
 * @api {post} /kyrosapi/uxos Request all UXOs
 * @apiName GetUxos
 * @apiGroup UXO
 * @apiVersion 1.0.1
 * @apiDescription List of UXOs
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/uxos
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","description","weight","latitude","longitude","height"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} uxo       List of UXOs
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "startRow" : 0,
 *         "endRow" : 2,
 *         "totalRows" : 2,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "description": "Explosivo militar",
 *              "weight": 200,
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "height": "-40"
 *           },
 *           {
 *              "id": 124,
 *              "description": "Explosivo militar",
 *              "weight": 10,
 *              "latitude": 39.121323,
 *              "longitude": "4.4667878",
 *              "height": "-10"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/uxos/', function(req, res)
{
    log.info("POST: /uxos");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    UxoModel.getUxos(startRow, endRow, sortBy, function(error, data, totalRows)
    {
        if (data == null)
        {
          res.status(200).json({"response": {"status":0,"data": {"record": []}}})
        }
        else if (typeof data !== 'undefined')
        {
          if (startRow == null || endRow == null) {
            startRow = 0;
            endRow = totalRows;
          }
          res.status(200).json({"response": {"status":0,"totalRows":totalRows,"startRow":parseInt(startRow),"endRow":parseInt(endRow),"status":0,"data": { "record": data}}})
        }
        //en otro caso se muestra un error
        else
        {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
    });
});

/* GET. Se obtiene un UXO por su id */
/**
 * @api {get} /kyrosapi/uxo/:id Request UXO information
 * @apiName GetUxo Request uxo information
 * @apiGroup UXO
 * @apiVersion 1.0.1
 * @apiDescription UXO information
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/uxo
 *
 * @apiParam {Number} id UXO unique ID
 *
 * @apiSuccess {Number} id UXO unique ID
 * @apiSuccess {String} description Description of UXO
 * @apiSuccess {Number} weight Weight of UXO
 * @apiSuccess {Number} longitude Longitude of the UXO (WGS84)
 * @apiSuccess {Number} latitude Latitude of the UXO (WGS84)
 * @apiSuccess {Number} height Depth under sea (meters)
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "startRow" : 0,
 *         "endRow" : 1,
 *         "totalRows" : 1,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "description": "Explosivo militar",
 *              "weight": 200,
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "height": "40"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiError UxoNotFound The <code>id</code> of the uxo was not found.
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/uxo/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /uxo/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
        UxoModel.getUxo(id,function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe se envia el json
            if (typeof data !== 'undefined' && data.length > 0)
            {
                res.status(200).json({"response": {"status":0,"totalRows":1,"startRow":0,"endRow":1,"data": {"record": [data]}}})
            }
            //en otro caso se muestra un error
            else
            {
                res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
    }
    //si la id no es numerica mostramos un error de servidor
    else
    {
        res.status(202).json({"response": {"status":status.STATUS_UPDATE_WITHOUT_PK_ERROR,"description":messages.ID_NUMERIC_ERROR}})
    }
});

/* PUT. Actualizar un UXO existente */
/**
 * @api {put} /kyrosapi/uxo/ Update UXO
 * @apiName PutNewUxo
 * @apiGroup UXO
 * @apiVersion 1.0.1
 * @apiDescription Update UXO
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/uxo
 *
 * @apiParam {Number} id UXO unique ID
 * @apiParam {String} description Description of UXO
 * @apiParam {Number} weight Weight of UXO
 * @apiParam {Number} longitude Longitude of the UXO (WGS84)
 * @apiParam {Number} latitude Latitude of the UXI (WGS84)
 * @apiParam {Number} [height=0] Depth under sea (meters)
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "description": "Explosivo militar",
 *              "weight": 200,
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "height": "40"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.put('/uxo', function(req, res)
{
    log.info("PUT: /uxo");

    var id_value = req.body.id || req.query.id;
    var description_value = req.body.description || req.query.description || req.params.description;
    var weight_value = req.body.weight || req.query.weight || req.params.weight;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;
    var height_value = req.body.height || req.query.height || req.params.height;

    log.debug("  -> id:          " + id_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> weight:      " + weight_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);
    log.debug("  -> height:      " + height_value);

    if (height_value == null)
      height_value = 0;

    if (id_value == null || description_value == null || weight_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      //almacenamos los datos del formulario en un objeto
      var uxoData = {
          id : id_value,
          description : description_value,
          weight : weight_value,
          latitude : latitude_value,
          longitude : longitude_value,
          height : height_value
      };
      UxoModel.updateUxo(uxoData,function(error, data)
      {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si se ha actualizado correctamente mostramos un mensaje
            if(data && data.message)
            {
              res.status(200).json({"response": {"status":0,"data": {"record": [uxoData]}}})
            }
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
            }
          }
      });
    }
});

/**
 * @api {post} /kyrosapi/uxo/ Create new UXO
 * @apiName PostNewUxo
 * @apiGroup UXO
 * @apiVersion 1.0.1
 * @apiDescription Create new UXO
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/uxo
 *
 * @apiParam {String} description Description of UXO
 * @apiParam {Number} weight Weight of UXO
 * @apiParam {Number} longitude Longitude of the UXO (WGS84)
 * @apiParam {Number} latitude Latitude of the UXI (WGS84)
 * @apiParam {Number} [height=0] Depth under sea (meters)
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "description": "Explosivo militar",
 *              "weight": 200,
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "height": "40"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.post("/uxo", function(req,res)
{
    log.info("POST: /uxo");

    // Crear un objeto con los datos a insertar del uxo
    var description_value = req.body.description || req.query.description || req.params.description;
    var weight_value = req.body.weight || req.query.weight || req.params.weight;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;
    var height_value = req.body.height || req.query.height || req.params.height;

    log.debug("  -> description: " + description_value);
    log.debug("  -> weight:      " + weight_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);
    log.debug("  -> height:      " + height_value);

    if (height_value == null)
      height_value = 0;

    if (description_value == null || weight_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var uxoData = {
          id : null,
          description : description_value,
          weight : weight_value,
          latitude : latitude_value,
          longitude : longitude_value,
          height : height_value
      };

      UxoModel.insertUxo(uxoData,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          // si se ha insertado correctamente mostramos su messaje de exito
          if(data && data.insertId)
          {
              uxoData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [uxoData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* DELETE. Eliminar un uxo */
/**
 * @api {delete} /kyrosapi/uxo Delete UXO
 * @apiName DeleteUxo
 * @apiGroup UXO
 * @apiVersion 1.0.1
 * @apiDescription Delete UXO
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/uxo
 *
 * @apiParam {Number} id UXO unique ID
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "description": "Explosivo militar",
 *              "weight": 200,
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "height": "40"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.delete("/uxo/", function(req, res)
{
    log.info("DELETE: /uxos");

    // id del uxo a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      UxoModel.deleteUxo(id,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
            if(data && data.message != "notExist")
            {
              res.status(200).json({"response": {"status":0,"data": {"record": data}}})
            }
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
            }
        }
        });
      }
  });

module.exports = router;
