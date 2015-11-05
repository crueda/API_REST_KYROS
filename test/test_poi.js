var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var uxoInserted = 0;

describe('UXO', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all UXOs', function(done) {
      //this.timeout(500);
      //setTimeout(done, 300);

    request(url)
	  .post('/kyrosapi/uxos')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add UXO', function(done) {
    var body = {
      description: 'uxo description',
      weight: 99,
      latitude: 40.3,
      longitude: -2.1,
      height: -50
  	};
	request(url)
	.post('/kyrosapi/uxo')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
        //console.log(res);
        uxoInserted = res.body.response.data.record[0].id;
				res.status.should.be.equal(201);
				done();
			});
	});

  it('[GET]    Get UXO', function(done) {
  request(url)
  .get('/kyrosapi/uxo/'+uxoInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update UXO', function(done){
  var body = {
  id: uxoInserted,
  description: 'new description',
  weight: '10',
  latitude: '41.3',
  longitude: '-3.1',
  height: '-50'
  };
  request(url)
  .put('/kyrosapi/uxo')
  .send(body)
  .expect('Content-Type', /json/)
  .expect(200) //Status code
  .end(function(err,res) {
    if (err) {
      throw err;
    }
    // Should.js fluent syntax applied
    done();
  });
  });

  it('[DELETE]  Remove UXO', function(done) {
    var body = {
      id: uxoInserted
  	};
	request(url)
	.delete('/kyrosapi/uxo')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.status.should.be.equal(200);
				done();
			});
	});

  });
});
