const PADDING_BUBBLE = 15 // distance between edge end and bubble
const PADDING_LABEL = 30 // distance between edge end and engineer name
const BUBBLE_SIZE_MIN = 7
const BUBBLE_SIZE_MAX = 20

var diameter = 860,
    radius = diameter / 2,
    innerRadius = radius - 170; // between center and edge end

var cluster = d3.cluster()
    .size([360, innerRadius]);

var line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(function (d) { return d.y; })
    .angle(function (d) { return d.x / 180 * Math.PI; });

var svg = d3.select("#graph_visualization").append("svg")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight)
    .style("display", "block");

var g = svg.append("g");

var link = g.append("g").selectAll(".link"),
    label = g.append("g").selectAll(".label"),
    bubble = g.append("g").selectAll(".bubble");

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "none")
    .call(d3.zoom().on("zoom", function () {
        var transform = d3.event.transform;
        g.attr("transform", transform);
    }));

var bubbleSizeScale = d3.scaleLinear()
    .domain([0, 100])
    .range([BUBBLE_SIZE_MIN, BUBBLE_SIZE_MAX]);

d3.json("/data_1.json", function (error, graphData) {
    if (error) {
        console.error("Error occured when loading data: ", error);
        return;
    }

    var root = createHierarchyForRadialLayoutFromFlatData(graphData)
        .sum(function (d) { return d.size; });

    cluster(root); // computes layout coordinates
    let leaves = root.leaves()

    link = g.selectAll(".link")
        .data(getLinksOfAllNodes(leaves))
        .enter()
        .append("path")
        .attr("class", "link")
        .each(function (d) { d.source = d[0], d.target = d[d.length - 1]; })
        .attr("d", line)
        .attr("id", d => {
            return `link-${[d.source.data.name.replace(/\s+/g, "-"), d.target.data.name.replace(/\s+/g, "-")].sort().join("-")}`;
        })
        .attr("fill", "none")
        .attr("stroke", "black")

    label = label
        .data(leaves)
        .enter().append("text")
        .attr("class", "label")
        .attr("id", d => `link-${d.data.name.replace(/\s+/g, "-")}-${d.data.links.forEach(link => link.replace(/\s+/g, "-"))}`)
        .attr("dy", "0.31em")
        .text(function (d) { return toTitleCase(d.data.key); })
        .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + PADDING_LABEL) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
        .text(function (d) { return d.data.key; })
        .style("font-family", "'Roboto', Arial, Helvetica, sans-serif");

    var tooltip = d3.select("#graph_visualization").append("div")
        .attr("class", "tooltip");

    bubble = g.selectAll(".node")
        .data(leaves)
        .enter()
        .append("circle")
        .attr("id", d => `node-${d.data.name.replace(/\s+/g, "-")}`)
        .attr("class", "bubble")
        .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + PADDING_BUBBLE) + ",0)" })
        .attr('r', d => bubbleSizeScale(d.value))
        .attr('stroke', 'black')
        .attr('fill', '#69a3b2')
        .style("pointer-events", "all")
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9); // Fully opaque
            tooltip.html("<strong>" + toTitleCase(d.data.name) + "</strong><br/>" + d.data.description) // Bold title
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (clickedData) {
            d3.event.stopPropagation();

            // Dim everything initially
            d3.selectAll('.bubble').style('opacity', 0.2);
            d3.selectAll('path.link').style('opacity', 0.1);

            // Highlight the clicked node
            d3.select(this).style('opacity', 1);

            const { visitedNodes, visitedEdges } = findConnections(clickedData.data.name, leaves);

            visitedNodes.forEach(nodeName => {
                d3.select(`#node-${nodeName.replace(/\s+/g, "-")}`).style('opacity', 1);
            });

            visitedEdges.forEach(edgeId => {
                d3.select(`path#link-${edgeId}.link`).style('opacity', 1);
            });
        });

    svg.call(d3.zoom().on("zoom", function () {
        g.attr("transform", d3.event.transform);
    }));

    // Reset highlights
    svg.on("click", function () {
        d3.selectAll('.bubble').style('opacity', 1);
        d3.selectAll('path.link').style('opacity', 1);
    });
})

function findConnections(nodeName, leaves) {
    let visitedNodes = new Set([nodeName]); // add original node
    let visitedEdges = new Set();

    let linksMap = createLinksMapFromLeaves(leaves);

    // Directly access and iterate through connections of the nodeName
    if (linksMap.has(nodeName)) {
        linksMap.get(nodeName).forEach(connectedNode => {
            if (!visitedNodes.has(connectedNode)) {
                visitedNodes.add(connectedNode);
                let edgeId = `${[nodeName.replace(/\s+/g, "-"), connectedNode.replace(/\s+/g, "-")].sort().join("-")}`;
                visitedEdges.add(edgeId);
            }
        });
    }

    return { visitedNodes, visitedEdges };
}

function createLinksMapFromLeaves(leaves) {
    const linksMap = new Map();

    leaves.forEach(leaf => {
        if (leaf.data.links) {
            leaf.data.links.forEach(linkName => {
                if (!linksMap.has(leaf.data.name)) {
                    linksMap.set(leaf.data.name, new Set());
                }
                linksMap.get(leaf.data.name).add(linkName);

                if (!linksMap.has(linkName)) {
                    linksMap.set(linkName, new Set());
                }
                linksMap.get(linkName).add(leaf.data.name);
            });
        }
    });

    return linksMap;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function createHierarchyForRadialLayoutFromFlatData(nodesData) {
    var map = {};

    nodesData.forEach((d) => {
        find(d.name, d);
    });

    function find(name, data) {
        var node = map[name], i;
        if (!node) {
            node = map[name] = data || { name: name, children: [] };
            if (name.length) {
                node.parent = find('');
                console.log(node.parent);
                node.parent.children.push(node);
                node.key = name.substring(i + 1);
            }
        }
        return node;
    }

    if (!map[""]) {
        throw new Error("Root node is undefined");
    }

    return d3.hierarchy(map[""]);
}

function getLinksOfAllNodes(nodes) {
    var map = {},
        links = [];

    // Compute a map from name to node.
    nodes.forEach(function (d) {
        map[d.data.name] = d;
    });

    // For each import, construct a link from the source to target node.
    nodes.forEach(function (d) {
        if (d.data.links) d.data.links.forEach(function (i) {
            links.push(map[d.data.name].path(map[i]));
        });

    });

    return links;
}