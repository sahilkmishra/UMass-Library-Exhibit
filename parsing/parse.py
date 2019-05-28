import sys
import json

LINKDATA = ['topic', 'collection', 'FacetName']
TOPLEVELDATA = ['itemID', 'title', 'abstract', 'dateDisplay', 'year']

def main():
    filename = sys.argv[1]
    parseResult = []
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
            parseResult.append(dataToPreserve)

    linkTable = {}
    for item in parseResult:
        for link in item['linkdata']:
            if not link in linkTable:
                linkTable[link] = []
            linkTable[link].append(item['itemID'])

    finalResult = {'nodes': parseResult, 'links' : linkTable}

    with open("result"+str(filename),"w+") as outFile:
        json.dump(finalResult,outFile)

    print("done")

def insert_if_available(giveTo,takeFrom,key):
    if key in takeFrom:
        giveTo[key] = takeFrom[key]

if __name__ == '__main__':
    main()

