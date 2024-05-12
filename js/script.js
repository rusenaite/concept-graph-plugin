//import { fetchPosts, fetchTags } from './api.js';

// Fetch API data

const BASE_URL = 'http://localhost:8082/areteios/wp-json/wp/v2';
const DICTIONARY_ITEM_TYPE = 5;

async function fetchPosts() {
    try {
        const response = await fetch(`${BASE_URL}/posts?per_page=100`);
        const postsData = await response.json();

        const transformedData = postsData
            .filter(post => post.type === 'post' && post.categories.includes(DICTIONARY_ITEM_TYPE))
            .map(post => ({
                name: post.title.rendered.toLowerCase(),
                description: post.content.rendered,
                links: post.tags
            }));

        return transformedData;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

async function fetchTags() {
    try {
        const response = await fetch(`${BASE_URL}/tags?per_page=100`);
        const tagsData = await response.json();

        const transformedTags = tagsData
            .filter(tag => tag.taxonomy === 'post_tag')
            .map(tag => ({
                id: tag.id,
                name: tag.name.toLowerCase()
            }));

        return transformedTags;
    } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
    }
}

async function mapPostsAndTags(tags, posts) {
    const tagMap = new Map(tags.map(tag => [tag.id, tag.name]));

    const postsWithTags = posts.map(post => {
        return {
            ...post,
            links: post.links.map(tagId => tagMap.get(tagId)).filter(Boolean)
        };
    });

    return postsWithTags;
}

async function getGraphData() {
    try {
        const tags = await fetchTags();
        const posts = await fetchPosts();

        return await mapPostsAndTags(tags, posts);
    } catch (error) {
        console.error('Error combining posts and tags:', error);
    }
}

// =================================================================================

const PADDING_BUBBLE = 15 // distance between edge end and bubble
const PADDING_LABEL = 30 // distance between edge end and engineer name
const BUBBLE_SIZE_MIN = 7
const BUBBLE_SIZE_MAX = 20

let diameter = 860,
    radius = diameter / 2,
    innerRadius = radius - 170; // between center and edge end

let cluster = d3.cluster()
    .size([360, innerRadius]);

let line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(d => d.y)
    .angle(d => d.x / 180 * Math.PI);

let svgContainer = d3.select("#graph_visualization");

let svg = svgContainer.append("svg")
    .attr("width", window.innerWidth - 20)
    .attr("height", window.outerHeight);

let translate = [window.innerWidth / 2, window.outerHeight / 2];

let g = svg.append("g").attr("transform", `translate(${translate[0]},${translate[1]})`);

let link = g.append("g").selectAll(".link"),
    label = g.append("g").selectAll(".label"),
    bubble = g.append("g").selectAll(".bubble");

let initialTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(1);
svg.call(d3.zoom().transform, initialTransform);

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "none")
    .call(d3.zoom().on("zoom", function () {
        let transform = d3.event.transform;
        g.attr("transform", transform);
    }));

let bubbleSizeScale = d3.scaleLinear()
    .domain([0, 100])
    .range([BUBBLE_SIZE_MIN, BUBBLE_SIZE_MAX]);

buildGraph();

//=========================================================================================

async function buildGraph() {
    try {
        const graphData = await getGraphData();

        let root = createHierarchyForRadialLayoutFromFlatData(graphData)
            .sum(node => node.size);

        cluster(root); // computes layout coordinates
        let leaves = root.leaves()

        link = g.selectAll(".link")
            .data(getLinksOfAllNodes(leaves))
            .enter()
            .append("path")
            .attr("class", "link")
            .each(function (link) { link.source = link[0], link.target = link[link.length - 1]; })
            .attr("id", d => {
                let edgeId = generateEdgeId(d[0].data.name, d[2].data.name);
                return `link-${edgeId}`;
            })
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "black")

        label = label
            .data(leaves)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("id", node => {
                const linksPart = node.data.links.map(link => link.replace(/\s+/g, "-")).join("-");
                return `node-${node.data.name.replace(/\s+/g, "-")}-${linksPart}`;
            })
            .attr("dy", "0.31em")
            .text(d => toTitleCase(d.data.key))
            .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + PADDING_LABEL) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
            .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
            .style("font-family", "'Roboto', Arial, Helvetica, sans-serif");

        let tooltip = d3.select("#graph_visualization").append("div")
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
                const title = toTitleCase(d.data.name);
                const descriptionCharLimit = 200;

                let description = d.data.description;
                if (description.length > descriptionCharLimit) {
                    description = description.substring(0, description.lastIndexOf(" ", descriptionCharLimit)) + "...";
                }

                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9); // Fully opaque
                tooltip.html("<strong>" + title + "</strong><br/>" + description)
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
    } catch (error) {
        console.error('Error occurred when fetching data:', error);
    }
}

function findConnections(nodeName, leaves) {
    let visitedNodes = new Set([nodeName]); // add original node
    let visitedEdges = new Set();

    let linksMap = createLinksMapFromLeaves(leaves);

    // Find outbound links
    if (linksMap.has(nodeName)) {
        linksMap.get(nodeName).forEach(connectedNode => {
            if (!visitedNodes.has(connectedNode)) {
                visitedNodes.add(connectedNode);
                let edgeId = generateEdgeId(nodeName, connectedNode);
                visitedEdges.add(edgeId);
            }
        });
    }

    // Find inbound links
    Array.from(linksMap.entries()).forEach(([node, connectedNodes]) => {
        if (connectedNodes.has(nodeName.toLowerCase()) && !visitedNodes.has(node)) {
            visitedNodes.add(node);
            let edgeId = generateEdgeId(node, nodeName);
            visitedEdges.add(edgeId);
        }
    });

    return { visitedNodes, visitedEdges };
}

function generateEdgeId(source, target) {
    return `${[source.replace(/\s+/g, "-"), target.replace(/\s+/g, "-")].sort().join("-")}`;
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
    let map = {};

    nodesData.forEach((node) => {
        find(node.name, node);
    });

    function find(name, data) {
        let node = map[name], i;
        if (!node) {
            node = map[name] = data || { name: name, children: [] };
            if (name.length) {
                node.parent = find('');
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
    let nodesMap = {},
        links = [];

    // Compute a map from name to node.
    nodes.forEach(node => {
        nodesMap[node.data.name] = node;
    });

    // For each import, construct a link from the source to target node.
    nodes.forEach(node => {
        if (node.data.links) {
            node.data.links.forEach(link => {
                let source = nodesMap[node.data.name];
                let target = nodesMap[link];

                if (target === undefined) {
                    console.log('target is undefined');
                    console.log('link', link);
                } else {
                    let createdLink = source.path(target);
                    links.push(createdLink);
                }
            });
        }
    });

    return links.filter(link => link.length === 3);
}
