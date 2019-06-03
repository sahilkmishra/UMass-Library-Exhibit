import sys
import json

LINKDATA = ['topic', 'collection', 'FacetName']
TOPLEVELDATA = [ 'title',  'dateDisplay']
TOPLEVELDATAINARRAY = ['abstract', 'year']

def main():
    filename = sys.argv[1]
    parseResult = {}
    parserResultByYear = {}
    years = {}
    with open(filename) as jsonFile:
        jsonFromFile = json.load(jsonFile)
        for item in jsonFromFile['response']['docs']:
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
                parserResultByYear[dataToPreserve['year']] = []
            parserResultByYear[dataToPreserve['year']].append(dataToPreserve)

    linkTable = {}
    linksflat = {}
    for itemID, item in parseResult.items():
        for link in item['linkdata']:
            if not link in linkTable:
                linkTable[link] = []
            for existingLink in linkTable[link]:
                if parseResult[existingLink]['year'] != item['year']:
                    continue
                if not item['year'] in linksflat:
                    linksflat[item['year']] = []
                linksflat[item['year']].append({'target': itemID, 'source': existingLink, 'strength': 1})
            linkTable[link].append(itemID)

    for linkID, links in linkTable.items():
        if len(links) <= 1:
            del linkTable[linkID]

    finalResult = {'nodes': parserResultByYear, 'links' : linksflat, 'years' : sorted(years.keys())}

    with open("result"+str(filename),"w+") as outFile:
        json.dump(finalResult,outFile)

    print("done")

def insert_if_available(giveTo,takeFrom,key,inArray):
    if key in takeFrom:
        if inArray:
            giveTo[key] = takeFrom[key][0]
        else:
            giveTo[key] = takeFrom[key]

if __name__ == '__main__':
    main()
