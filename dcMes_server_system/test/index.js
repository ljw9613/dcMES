const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
describe('GET /user', function () {
  it('respond with json', function (done) {
    request('http://localhost:3000')
      .get('/users')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.include('a');
        done(err)
      })

  })
})
