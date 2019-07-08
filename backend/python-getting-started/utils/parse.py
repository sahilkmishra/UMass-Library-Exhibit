import json

LINKDATA = ['topic', 'collection','FacetName']
TOPLEVELDATA = [ 'title',  'dateDisplay']
TOPLEVELDATAINARRAY = ['abstract', 'year']

def parese_data(json):
    parseResult = {}
    parserResultByYear = {}
    years = {}
    for item in json['response']['docs']:
        dataToPreserve = {}
        linkData = {}
        for key in TOPLEVELDATA:
            insert_if_available(dataToPreserve,item,key,False)
        for key in TOPLEVELDATAINARRAY:
            insert_if_available(dataToPreserve,item,key,True)
        for key in LINKDATA:
            insert_if_available(linkData,item,key,False)
        if 'year' in item:
            years[str(item['year'][0])] = 1
        else:
            years['undated'] = 1
        dataToPreserve['linkdata'] = sorted({x for v in linkData.itervalues() for x in v})
        parseResult[item['itemID']] = dataToPreserve
        if not dataToPreserve['year'] in parserResultByYear:
            parserResultByYear[dataToPreserve['year']] = {}
        parserResultByYear[dataToPreserve['year']][item['itemID']] = dataToPreserve

    linkTable = {}
    for itemId, item in parseResult.items():
        for link in item['linkdata']:
            if not link in linkTable:
                linkTable[link] = []
            linkTable[link].append(itemId)

    numberOfNodes = len(parseResult.keys())
    for linkKey, links in linkTable.items():
        #"print(str(len(links))++str(numberOfNodes))"
        if len(links) >= numberOfNodes * 1:
            linkTable.pop(linkKey)
            print(linkKey)

    for linkID, links in linkTable.items():
        if len(links) <= 1:
            del linkTable[linkID]

    linksByYear = {}
    linksFlat = {}
    for key,ids in linkTable.items():
        for itemId in ids:
            itemIdYear = parseResult[itemId]['year']
            for toAddItemId in ids[ids.index(itemId)+1:]:

                linkId = (toAddItemId + itemId) if itemId > toAddItemId else (itemId + toAddItemId)
                if linkId in linksFlat:
                    linksFlat[linkId]['strength']+=1
                    if linkId in linksByYear [itemIdYear]:
                        linksByYear[itemIdYear][linkId]['strength']+=1
                    continue

                linksFlat[linkId] = {'target': itemId, 'source': toAddItemId, 'strength': 1}
                if (itemIdYear != parseResult[toAddItemId]['year']):
                    continue
                if not itemIdYear in linksByYear:
                    linksByYear[itemIdYear] = {}
                linksByYear[itemIdYear][linkId] = {'target': itemId, 'source': toAddItemId, 'strength': 1}

    resultLinks = {}
    for year,links in linksByYear.items():
        resultLinks[year] = []
        for _, link in links.items():
            resultLinks[year].append(link)
    resultLinksFlat = []
    for linkId, link in linksFlat.items():
        resultLinksFlat.append(link)


    return {'nodes': parserResultByYear, 'links' : resultLinks, 'nodes_flat': parseResult, 'links_flat': resultLinksFlat, 'years' : sorted(years.keys())}

def insert_if_available(giveTo,takeFrom,key,inArray):
    if key in takeFrom:
        if inArray:
            giveTo[key] = takeFrom[key][0]
        else:
            giveTo[key] = takeFrom[key]