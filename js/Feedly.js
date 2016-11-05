/**
 * Module that handles calls to feedly
 *
 * Created by cha on 4/2/2016.
 */

var NodeRequester = require("xmlhttprequest").XMLHttpRequest;
var Feedly = {
    maxAge: 1000 * 60 * 5,
    maxNews: 100,
    maxProviders:10,
  
    request: function (url, callback) {
        xmlhttp = new NodeRequester();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4){
                if(xmlhttp.status = 200){
                    callback(xmlhttp.responseText);
                }else{
                    console.log("failed request " + url)
                }
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    },

    getProviders: function (callback) {

        this.request('https://cloud.feedly.com/v3/search/feeds?query=nyheder&locale=da_DK&count='+this.maxProviders, function (body) {
            callback(parse(body))
        });

        function parse(body) {
            var providers = [];
            var response = JSON.parse(body);
            var results = response.results;
            results.forEach(function (result) {
                var provider = {};
                provider.feedId = result.feedId;
                provider.name = result.website;
                if (provider.name == null) {
                    provider.name = result.title
                }
                provider.iconUrl = result.iconUrl;
                providers.push(provider)
            });
            return providers
        }
    },

    parseEntries: function (provider, result) {
        var self=this;
        function stripHtml(html){
            return html.replace(/<(?:.|\n)*?>/gm, '');
        }
        var parsed = JSON.parse(result);
        var entries = [];
        if (parsed.items) {
            parsed.items.forEach(function (item) {
                var newsItem = {};
                newsItem.title = item.title;
                if (item.summary){
                    var wrapped = "<![CDATA["+item.summary.content+"]]>";
                    var strippedContent = stripHtml(item.summary.content);
                    newsItem.summary = strippedContent
                }
                newsItem.content = item.content;
                if (item.visual && item.visual.url){
                    newsItem.visual = item.visual.url;
                }


                newsItem.published = new Date(item.published).toDateString();
                newsItem.timeStamp = item.published;
                newsItem.provider = provider.name;
                if (newsItem.visual  && newsItem.visual.length > 10) {
                    if(newsItem.summary && newsItem.summary.length > 10){
                        if(self.urlCache.indexOf(newsItem.visual)==-1){
                            entries.push(newsItem)
                            self.urlCache.push(newsItem.visual)
                        }
                    }
                }
            });
        }
        return entries
    },

    getProviderNews: function (provider, newerThan, callback) {
        var self = this
        var feedid = provider.feedId;
        if (newerThan != null) {
            this.request('https://cloud.feedly.com/v3/streams/contents?streamId=' + feedid + '&count='+this.maxNews+'&newerThan=' + newerThan, handleResult)
        } else {
            this.request('https://cloud.feedly.com/v3/streams/contents?streamId=' + feedid + '&count='+this.maxNews, handleResult)
        }

        function handleResult(result) {
            var entries = self.parseEntries(provider, result);
            callback(entries)
        }

    },

    getSomeNews: function (antal,callBack) {
        var self = this
        var items
        // only call for new news every maxAge minutes or first time

        function isToOld() {
            return self.feedcache.lastUpdate != null && Date.now() - self.feedcache.lastUpdate > this.maxAge;
        }

        function firstTime() {
            if(!self.feedcache.lastUpdate){
                return true
            }else{
                return false
            }
        }

        if (true ||firstTime() ||  isToOld() ) {
            this.getAllNewsFrom(null, function (list) {
                list.sort(function(a,b){
                    return b.timeStamp - a.timeStamp;
                })
                self.feedcache.lastUpdate = Date.now
                self.feedcache.data = list;
                if(antal){
                    callBack(list.slice(0,antal));
                }else{
                    callBack(list);
                }

            })
        } else {
            callBack(self.feedcache.data)
        }


    },
    getAllNews: function(callback){
        var self = this
      return self.getSomeNews(100,callback);
    },
    getAllNewsFrom: function (newerThan, callback) {
        var self = this
        this.getProviders(function (result) {
            var allList = [];
            var providers = result
            var count = providers.length;

            providers.forEach(function (provider) {
                self.getProviderNews(provider, newerThan, function (list) {
                    count = count - 1;
                    if (list.length > 0) {
                        allList.push.apply(allList, list);
                    }
                    if (count == 0) {
                        callback(allList)
                    }
                })
            })

        })

    }
}




module.exports = Feedly