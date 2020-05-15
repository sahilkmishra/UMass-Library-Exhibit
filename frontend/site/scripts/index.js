//This is where all of the rendered nodes live 
var nodes = []
var nodesFlat = []
//This is where the links that are rendered live
var links = []
//These are the available subjects that we can link and search by
var linkAnnotations = []
var selectedNode = null
var width = window.innerWidth
var height = window.innerHeight
var linkForce = d3.forceLink()
    .links(links)
    .id(link => link.id)
    .strength(link => Math.pow(link.strength, 3) / 30000)
    .distance(link => Math.pow(link.strength, 3) / 30000)
const simulation = d3.forceSimulation()
    .force('link', linkForce)
    // .force('charge', d3.forceManyBody().strength(-35))
    .force('gravity', d3.forceManyBody(0.05))
    .force('center', d3.forceCenter(width / 2, height / 2))
var canvas = document.getElementById("main-canvas");
var zoomcanvas = document.getElementById("zoom-canvas");
var platform = Stardust.platform("webgl-2d", canvas, width, height);
var snodes = Stardust.mark.create(Stardust.mark.circle(10), platform);
var sedges = Stardust.mark.create(Stardust.mark.line(), platform);
var stexts = Stardust.mark.createText("2d", platform);

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
            nodesFlat = json['nodes_flat']
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
                $('<a/>')
                    .addClass('bottom-bar-li')
                    .text(json['years'][i])
                    .appendTo(li);
            });
            updateSimulation()
        }
    });
    return json;
})();

var zoom_scale = 1.0, zoom_t_x = 0.0, zoom_t_y = 0.0;
var isDragging = false
d3.select(canvas).call(d3.zoom().on("zoom", zoomed).scaleExtent([0.25, 8]).filter(() => {
    var mouseCoords = d3.mouse(canvas);
    var p = platform.getPickingPixel(mouseCoords[0] * platform.pixelRatio, mouseCoords[1] * platform.pixelRatio);
    if (p) return false;
    return true;
}));
function zoomed() {
    zoom_scale = Math.min(8, Math.max(d3.event.transform.k, 1 / 8));
    zoom_t_x = d3.event.transform.x;
    zoom_t_y = d3.event.transform.y;
}

snodes.attr("center", (d) => [d.x ? d.x * zoom_scale + zoom_t_x : d.x = 0, d.y ? d.y * zoom_scale + zoom_t_y : d.y = 0]);
snodes.attr("radius", (d) => Math.pow(10, zoom_scale));
snodes.attr("color", [0.5, 0.5, 0.5, 1]);
sedges.attr("p1", (d) => { return (d.source.x) ? [d.source.x * zoom_scale + zoom_t_x, d.source.y * zoom_scale + zoom_t_y] : [0, 0] });
sedges.attr("p2", (d) => { return (d.target.x) ? [d.target.x * zoom_scale + zoom_t_x, d.target.y * zoom_scale + zoom_t_y] : [0, 0] });
sedges.attr("color", [0, 0, 0.25, 0.1]);
sedges.attr("width", (d) => d.strength * 3);
stexts.attr("position", (d) => [d.x * zoom_scale + zoom_t_x + 10, d.y * zoom_scale + zoom_t_y + 10]);
stexts.attr("text", (d) => d.title);
stexts.attr("fontSize", 10);
simulation.nodes(nodes)

function findInNodes(key) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i]["id"] === key)
            return nodes[i]
    }
    return null
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
    zoom_scale = 1.0
    zoom_t_x = 0.0
    zoom_t_y = 0.0;

    console.log("AY")
    var newNodes = flattenNodes(json['nodes'][year])
    replaceNodes(newNodes)

    links = json['links'][year] != null ? json['links'][year] : []
    _currentYear = year
}
function selectNode(node) {
    zoom_scale = 1.0
    zoom_t_x = 0.0
    zoom_t_y = 0.0;
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
        $('<a/>')
            .addClass('subject-button')
            .removeClass('default')
            .text(node['linkdata'][i])
            .appendTo(li);
    });
    openNav()
    updateDataByNode(node)
    updateSimulation()
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
    simulation.nodes(nodes)
    simulation.force('link').links(links)
    //simulation.alphaDecay(0.01).force("linkForce", linkForce)
    simulation.on("tick", () => {

        if (isDragging && selectedNode && draggingLocation) {
            selectedNode.x = draggingLocation[0]// * zoom_scale + zoom_t_x;
            selectedNode.y = draggingLocation[1]// * zoom_scale + zoom_t_y;
        }
        snodes.data(nodes)
        sedges.data(links)
        stexts.data(nodes)
        render()
    })
    simulation.alphaTarget(0.7).restart()
}
function render() {
    sedges.render()
    snodes.render()
    stexts.render()

    platform.beginPicking(canvas.width, canvas.height);
    snodes.attr("radius", 10); // make radius larger so it's easier to select.
    snodes.render();
    platform.endPicking();
}


var hasMoved = false;
var draggingLocation = null;
var ctx = null
var lastX = 0
var lastY = 0
window.onload = function () {
    ctx = canvas.getContext('webgl');
}

canvas.onclick = function (e) {
    var x = e.clientX - canvas.getBoundingClientRect().left;
    var y = e.clientY - canvas.getBoundingClientRect().top;
    var p = platform.getPickingPixel(x * platform.pixelRatio, y * platform.pixelRatio);
    if (p && !hasMoved) {
        selectedNode = nodes[p[1]];
        console.log(selectedNode)
        selectNode(selectedNode)
    }
    hasMoved = false
}
canvas.onmousedown = function (e) {
    console.log("hey")
    var x = e.clientX - canvas.getBoundingClientRect().left;
    var y = e.clientY - canvas.getBoundingClientRect().top;
    var p = platform.getPickingPixel(x * platform.pixelRatio, y * platform.pixelRatio);
    if (p) {
        selectedNode = nodes[p[1]];
        isDragging = true;
        draggingLocation = [selectedNode.x, selectedNode.y];
        var onMove = function (e) {
            var nx = (e.clientX - canvas.getBoundingClientRect().left- zoom_t_x) / zoom_scale;
            var ny = (e.clientY - canvas.getBoundingClientRect().top- zoom_t_y) /zoom_scale;


            selectedNode.x = nx
            selectedNode.y = ny
            draggingLocation = [nx, ny];
            simulation.alphaTarget(0.3).restart();
            hasMoved = true
        };
        var onUp = function () {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            selectedNode = null;
            draggingLocation = null;
            isDragging = false;
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }
};

canvas.onmousemove = function (e) {
    if (isDragging) return;
    var x = e.clientX - canvas.getBoundingClientRect().left;
    var y = e.clientY - canvas.getBoundingClientRect().top;
    var p = platform.getPickingPixel(x * platform.pixelRatio, y * platform.pixelRatio);
    if (p) {
        if (selectedNode != nodes[p[1]]) {
            selectedNode = nodes[p[1]];
        }
    } else {
        if (selectedNode != null) {
            selectedNode = null;
        }
    }
}

updateSimulation()