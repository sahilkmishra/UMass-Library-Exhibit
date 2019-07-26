const COLORS = ['blue', 'red', 'yellow', 'green', 'purple', 'orange']
var _currentYear = -1
//This function opens the side bar 
function openNav() {
    document.getElementById("side-bar").style.width = "350px";
    document.getElementById("main").style.marginRight = "350px";
    document.getElementById("bottom-bar").style.width = window.innerWidth - 350 + "px";
    d3.select('svg').attr('width', window.innerWidth - 350)
}

/*This function closes the side bar */
function closeNav() {
    document.getElementById("side-bar").style.width = "0";
    document.getElementById("main").style.marginRight = "0";
    document.getElementById("bottom-bar").style.width = window.innerWidth + "px";
    d3.select('svg').attr('width', window.innerWidth)
}
//This is where all of the rendered nodes live 
var nodes = []
//This is where the links that are rendered live
var links = []
//These are the available subjects that we can link and search by
var linkAnnotations = []
var linkAnnotationsToColors = {}
var json = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        //'url': 'assets/result100year2.json',
        'url': 'assets/result200.json',
        'dataType': "json",
        'success': function (data) {
            json = data;
            nodes = flattenNodes(json['nodes'][Object.keys(json['nodes'])[0]])
            links = json['links'][Object.keys(json['nodes'])[0]]
            linkAnnotations = json['link_annotations']
            $("#loading").hide()
            var years = $('ul#years')
            $.each(json['years'], function (i) {
                var li = $('<li/>')
                    .addClass('ui-menu-item')
                    .attr('role', 'menuitem')
                    .appendTo(years)
                    .click(function () {
                        updateDataByYear(json['years'][i])
                        updateSimulation()
                    });
                var aaa = $('<a/>')
                    .addClass('bottom-bar-li')
                    .text(json['years'][i])
                    .appendTo(li);
            });
            updateSimulation()
        }
    });
    return json;
})();
var colorToPick = [0]
var nextSegmentThreshhold = COLORS.length
linkAnnotations.forEach(e => {
    for (var i = 0; i < COLORS.length; i++) {
        if (colorToPick[i] == COLORS.length) {
            if (i + 1 == colorToPick.length)
                colorToPick.push(-1)
            COLORS[i + 1] += 1
            COLORS[i] = COLORS[i + 1]
        }
    }
    linkAnnotationsToColors[e] = colorToPick.slice()
    colorToPick[0]++
})
_currentYear = "1969"
//D3 stuff goes here
var width = window.innerWidth
var height = window.innerHeight
const radius = 10
const mainWindow = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
mainWindow.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .call(d3.zoom()
        .scaleExtent([1 / 16, 8])
        .on("zoom", zoomed));

const svg = mainWindow.append('g')
    .attr("id", "force-graph")
    .attr("width", width)
    .attr("height", height)
function zoomed() {
    svg.attr("transform", d3.event.transform);
}

const linkGroup = svg.append("g").attr("class", "links")
const nodeGroup = svg.append("g").attr("class", "nodes")
const textGroup = svg.append("g").attr("class", "texts")

var linkElements,
    nodeElements,
    textElements

const simulation = d3.forceSimulation()
    //.force('link', linkForce)
    .force('charge', d3.forceManyBody().strength(-35))
    //.force('gravity',d3.forceManyBody(0.05))
    .force('center', d3.forceCenter(width / 2, height / 2))

const dragDrop = d3.drag()
    .on('start', node => {
        node.fx = node.x
        node.fy = node.y
    })
    .on('drag', node => {
        simulation.alphaTarget(0.7).restart()
        node.fx = d3.event.x
        node.fy = d3.event.y
    })
    .on('end', node => {
        if (!d3.event.active) {
            simulation.alphaTarget(0)
        }
        node.fx = null
        node.fy = null
    })
simulation.force('link', d3.forceLink()
    .id(link => link.id)
    .strength(link => Math.pow(link.strength, 3) / 30000))
//.force('gravity',d3.forceManyBody(30))

function getNodeColor(node) {
    return 'gray'
}
function findByArray(array, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i].id === value) {
            return i;
        }
    }
    return -1;
}

//RENDER ORDER
function replaceNodes(newNodes) {
    nodes.splice(0, nodes.length)
    const diff = {
        //        removed: nodes.filter(node => findByArray(newNodes,node.id) === -1),
        added: newNodes.filter(node => findByArray(nodes, node.id) === -1)
    }

    //      diff.removed.forEach(node => nodes.splice(findByArray(nodes,node.id), 1))
    //TODO: determine if this line should be changed into newNodes.forEach(...
    diff.added.forEach(node => nodes.push(node))
}
function updateDataBySubject(subject) {
    var nodesToGet = {}
    var linksToAdd = []
    json['links_flat'].forEach(function (link) {
        if (link['links'].includes(subject)) {
            linksToAdd.push(link)
            //console.log(link['target'] + " : " + link['source'] )
            var targetId = link['target']
            var sourceId = link['source']
            if (typeof targetId == 'object') {
                nodesToGet[targetId.id] = targetId
            }
            else
                nodesToGet[targetId] = 1
            if (typeof sourceId == 'object') {
                nodesToGet[sourceId.id] = sourceId
            } else
                nodesToGet[sourceId] = 1
        }
    })
    console.log("links number: " + linksToAdd.length)
    console.log("nodes number: " + Object.keys(nodesToGet).length)
    nodesToAdd = []
    Object.keys(nodesToGet).forEach(function (nodeId) {
        var newNode = json['nodes_flat'][nodeId]
        if (newNode == null) {
            newNode = nodeId
        } else {
            if (typeof nodeId == 'string')
                newNode.id = nodeId
        }
        nodesToAdd.push(newNode)
    })
    replaceNodes(nodesToAdd)
    links = linksToAdd
    console.log('done selecting node')
}

function updateDataByNode(node) {
    var nodesToGet = []
    var linksToAdd = []
    json['links_flat'].forEach(function (link) {
        if (link['strength'] < 2)
            return
        /* Ok so this is the weirdest "I hate cs why did this happen" part of the code
          So d3 does this weird thing to save memory (or something idk) where it takes
          the ids that I have to represents nodes in links and puts the node value instead
          meaning that sometimes theres an id and sometimes theres a node so we can check the
          source/target field if its not been used otherwise we have to find the id field inside that

          This is wack
        */

        if (link['source'] === node.id || link['source'].id === node.id) {
            linksToAdd.push(link)
            nodesToGet.push(link['target'])
        } else if (link['target'] === node.id || link['target'].id === node.id) {
            linksToAdd.push(link)
            nodesToGet.push(link['source'])
        }
    })
    nodesToAdd = []
    nodesToGet.forEach(function (nodeId) {
        var newNode = json['nodes_flat'][nodeId]
        if (newNode == null) {
            newNode = nodeId
        } else {
            if (typeof nodeId == 'string')
                newNode.id = nodeId
        }
        nodesToAdd.push(newNode)
    })
    currNode = json['nodes_flat'][node.id]
    currNode.id = node.id
    nodesToAdd.push(currNode)
    replaceNodes(nodesToAdd)
    links = linksToAdd
    console.log('done selecting node')
}

function updateDataByYear(year) {

    console.log("AY")
    var newNodes = flattenNodes(json['nodes'][year])
    replaceNodes(newNodes)

    links = json['links'][year] != null ? json['links'][year] : []
    _currentYear = year
}
function selectNode(node) {
    $('#side-bar-title').html(node['title'])
    console.log(node)
    $('#side-bar-image').attr('src',
        'http://credo.library.umass.edu/images/resize/350/' + node['id'] + '-001.jpg')
    $('#side-bar-abstract').html(node['abstract'])
    $('#side-bar-link').attr('href', 'http://credo.library.umass.edu/view/full/' + node['id'])
    var topics = $('ul#topics')
    topics.empty()

    $.each(node['linkdata'], function (i) {
        if (!linkAnnotations.includes(node['linkdata'][i]))
            return
        var li = $('<li/>')
            .addClass('ui-menu-item')
            .attr('role', 'menuitem')
            .appendTo(topics)
            .click(function () {
                updateDataBySubject(node['linkdata'][i])
                updateSimulation()
            });
        var aaa = $('<a/>')
            .addClass('subject-button')
            .removeClass('default')
            .text(node['linkdata'][i])
            .appendTo(li);
    });
    openNav()
    updateDataByNode(node)
    updateSimulation()
}

function updateGraph() {
    // links
    linkElements = linkGroup.selectAll('line')
        .data(links, function (link) {
            return link.target.id + link.source.id
        })
    linkElements.exit().remove()
    var linkEnter = linkElements
        .enter().append('line')
        .attr('stroke-width', function (link) { return link.strength * 2 })
        .attr('stroke', function (link) { return 'rgba(0, 0, 50,' + 0.1 * link.strength + ')' })
    linkElements = linkEnter.merge(linkElements)

    // nodes
    nodeElements = nodeGroup.selectAll('circle')
        .data(nodes, function (node) { return node.id })

    nodeElements.exit().remove()

    var nodeEnter = nodeElements
        .enter()
        .append('circle')
        .attr('r', radius - .75)
        .attr('fill', 'gray')
        .call(dragDrop)
        // we link the selectNode method here
        // to update the graph on every click
        .on('click', selectNode)

    nodeElements = nodeEnter.merge(nodeElements)

    // texts
    textElements = textGroup.selectAll('text')
        .data(nodes, function (node) { return node.id })

    textElements.exit().remove()

    var textEnter = textElements
        .enter()
        .append('text')
        .text(function (node) { return node.title })
        .attr('font-size', 15)
        .attr('dx', 15)
        .attr('dy', 4);

    textElements = textEnter.merge(textElements)
}

function flattenNodes(nodesToFlatten) {
    newNodes = []
    for (var key in nodesToFlatten) {
        nodesToFlatten[key].id = key
        newNodes.push(nodesToFlatten[key])
    }
    return newNodes;
}


function updateSimulation() {
    updateGraph()
    simulation.nodes(nodes).on('tick', () => {
        nodeElements
            .attr('cx', function (node) { return node.x = node.x })
            .attr('cy', function (node) { return node.y = node.y })
        textElements
            .attr('x', function (node) { return node.x })
            .attr('y', function (node) { return node.y })
        linkElements
            .attr('x1', function (link) { return link.source.x })
            .attr('y1', function (link) { return link.source.y })
            .attr('x2', function (link) { return link.target.x })
            .attr('y2', function (link) { return link.target.y })
    })
    simulation.force('link').links(links)
    simulation.alphaTarget(0.7).restart()
}

updateSimulation()