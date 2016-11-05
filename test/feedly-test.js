var chai = require ('chai')
var feedly = require('../js/feedly')
var chaisorted = require('chai-sorted')

chai.use(chaisorted)

describe('feedly', function() {
    describe('getProviders', function () {
        it('should return a list of providers', function (done) {

            feedly.getProviders(function(response){
                var providers = response
                chai.expect(providers).to.be.a('array');
                providers.forEach(function(item){
                    chai.expect(item).to.include.keys('feedId','name')
                })
                done();
            });

        });
    });
    describe('getProviderNews', function () {
        this.timeout(5000);
        it('should return a list of news', function (done1) {
            feedly.getProviders(function(response){
                var providers = response
                var provider = providers[0]
                feedly.getProviderNews(provider,null,function(providerNews){
                    var providerNewsList = providerNews
                    chai.expect(providerNewsList).to.be.a('array');
                    done1()
                })

            })
        });
    });

    describe('getSomeNews', function () {
        this.timeout(5000);
        it('should return a list of some news', function (done) {
            feedly.getSomeNews(1000,function(response){
                chai.expect(response).to.be.a('array');
                chai.expect(response).to.be.to.be.sortedBy('timeStamp',true)
                done()
            })
        });
    });
 
});