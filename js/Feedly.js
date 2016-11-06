/**
 * Module that handles calls to feedly
 *
 * Created by cha on 4/2/2016.
 */

var NodeRequester = require("xmlhttprequest").XMLHttpRequest;
var urlCache = [];


var Feedly = {
    maxAge: 1000 * 60 * 5,
    maxNews: 100,
    maxProviders:10,

    getSomeNews: function (antal) {
        return new Promise(function(resolve,reject){
            getAllNewsFrom(null, function (list) {
                list.sort(function(a,b){
                    return b.timeStamp - a.timeStamp;
                })
                if(antal){
                    resolve(list.slice(0,antal));
                }else{
                    resolve(list);
                }
            })
        })


    }

}

function getProviderNews(provider, newerThan, callback) {
    var self = this
    var feedid = provider.feedId;
    if (newerThan != null) {
        request('https://cloud.feedly.com/v3/streams/contents?streamId=' + '/streams/contents?streamId=' + feedid + '&count='+this.maxNews+'&newerThan=' + newerThan, handleResult)
    } else {
        request('https://cloud.feedly.com/v3/streams/contents?streamId=' + feedid + '&count='+this.maxNews, handleResult)
    }

    function handleResult(result) {
        var entries = parseEntries(provider, result);
        callback(entries)
    }

}



function getAllNewsFrom(newerThan, callback) {
    getProviders(function (result) {
        var allList = [];
        var providers = result
        var count = providers.length;

        providers.forEach(function (provider) {
            getProviderNews(provider, newerThan, function (list) {
                count = count - 1;
                if (list.length > 0) {
                    allList.push.apply(allList, list);
                }
                if (count == 0) {
                    callback(allList);
                }
            })
        })

    })

}


function request(url, callback) {
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
}

function getProviders(callback) {

    request('https://cloud.feedly.com/v3/search/feeds?query=nyheder&locale=da_DK&count='+this.maxProviders, function (body) {
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
}

function parseEntries(provider, result) {
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
                    if(urlCache.indexOf(newsItem.visual)==-1){
                        entries.push(newsItem)
                        urlCache.push(newsItem.visual)
                    }
                }
            }
        });
    }
    return entries
}



module.exports = Feedly