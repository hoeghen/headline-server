var chai = require ('chai')
var feedly = require('../js/feedly')
var chaisorted = require('chai-sorted')

chai.use(chaisorted)

describe('feedly', function() {
    describe('getSomeNews', function () {
        this.timeout(5000);
        it('should return a list of some news', function (done) {
            var p = feedly.getSomeNews(1000)
            p.then(function(response){
                    chai.expect(response).to.be.a('array');
                    chai.expect(response).to.be.to.be.sortedBy('timeStamp',true)
                    done()
                }
            )
         });
    });
});