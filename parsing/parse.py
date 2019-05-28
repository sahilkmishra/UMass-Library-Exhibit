import sys
import json


def main():
    filename = sys.argv[1]
    parseResult = []
    with open(filename) as jsonFile:
        jsonFromFile = json.load(jsonFile)
        for item in jsonFromFile['response']['docs']:
            dataToPreserve = {}
            insert_if_available(dataToPreserve,item,'itemID')
            insert_if_available(dataToPreserve,item,'title')
            insert_if_available(dataToPreserve,item,'abstract')
            insert_if_available(dataToPreserve,item,'dateDisplay')
            insert_if_available(dataToPreserve,item,'year')
            insert_if_available(dataToPreserve,item,'topic')
            insert_if_available(dataToPreserve,item,'collection')
            insert_if_available(dataToPreserve,item,'FacetName')
            parseResult.append(dataToPreserve)

    with open("result"+str(filename),"w+") as outFile:
        json.dump(parseResult,outFile)

    print("done")

def insert_if_available(giveTo,takeFrom,key):
    if key in takeFrom:
        giveTo[key] = takeFrom[key]

if __name__ == '__main__':
    main()

