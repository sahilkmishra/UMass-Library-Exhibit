import sys
import json

LINKDATA = ['topic', 'collection', 'FacetName']
TOPLEVELDATA = [ 'title',  'dateDisplay']
TOPLEVELDATAINARRAY = ['abstract', 'year']

def main():
    filename = sys.argv[1]
    parseResult = {}
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

    linkTable = {}
    for itemID, item in parseResult.items():
        for link in item['linkdata']:
            if not link in linkTable:
                linkTable[link] = []
            linkTable[link].append(itemID)

    for linkID, links in linkTable.items():
        if len(links) <= 1:
            del linkTable[linkID]

    finalResult = {'nodes': parseResult, 'links' : linkTable, 'years' : sorted(years.keys())}

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
