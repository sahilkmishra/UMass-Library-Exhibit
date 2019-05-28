# Parser
> and he was no console man, no cyberspace cowboy. Just another hustler, trying to make it through.

This portion of the project is what is used to parse all of the data that is taken from the SCUA collections and turn it into something that is smaller and more usable in our frontend

## Fields we are preserving are:
* title
* abstract
* dateDisplay
    * These last three are only for the user to identify nodes
* itemID
    * For the system to generate thumbnails and links
* year
* topic
* collection
* FacetName
    * These last four are delimiters and what we link nodes based off of
## Linking
Once fields are preserved we also do the linking in this step which is done by a simple string comparrison (might be subject to change to something more complicated)
### Steps for Linking
1. Create a link hash table
2. Check all data values in `linkdata` and add `itemID`s for each element in `linkdata`