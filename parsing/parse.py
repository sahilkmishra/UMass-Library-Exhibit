import sys
import json

LINKDATA = ['topic', 'collection', 'FacetName']
TOPLEVELDATA = [ 'title', 'abstract', 'dateDisplay', 'year']

def main():
    filename = sys.argv[1]
    parseResult = {}
    with open(filename) as jsonFile:
        jsonFromFile = json.load(jsonFile)
        for item in jsonFromFile['response']['docs']:
            dataToPreserve = {}
            linkData = {}
            for key in TOPLEVELDATA:
                insert_if_available(dataToPreserve,item,key)
            for key in LINKDATA:
                insert_if_available(linkData,item,key)
            dataToPreserve['linkdata'] = sorted({x for v in linkData.itervalues() for x in v})
            dataToPreserve['links'] = []
            parseResult[item['itemID']] = dataToPreserve

    linkTable = {}
    for itemID, item in parseResult.items():
        for link in item['linkdata']:
            if not link in linkTable:
                linkTable[link] = []
            linkTable[link].append(itemID)

    for key, values in linkTable.items():
        for itemID in values:
            for secondID in values:
                if itemID is secondID:
                    continue
                parseResult[itemID]['links'].append(secondID)

    finalResult = {'nodes': parseResult}

    with open("result"+str(filename),"w+") as outFile:
        json.dump(finalResult,outFile)

    print("done")

def insert_if_available(giveTo,takeFrom,key):
    if key in takeFrom:
        giveTo[key] = takeFrom[key]

if __name__ == '__main__':
    main()
