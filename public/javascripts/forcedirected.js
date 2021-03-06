var nodeMap = {};
var force,svg,color;

var initialize = function() {
	var width = 900,
	height = 400;

	color = d3.scale.category20();

	force = d3.layout.force()
	.charge(-500)
	.gravity(0.05)
	.linkDistance(60)
	.size([width, height]);

	svg = d3.select("#chart").append("svg")
	.attr("width", width)
	.attr("height", height);

	if (rootAwesm) {
		addNode({
			'awesm_url': rootAwesm,
			'redirection_id': rootId
		},true);		
	}
}

function addNode(data,isRoot) {	
	console.log("adding node")
	var awesm_url = data['awesm_url'];
	var redirection_id = data['redirection_id'];
	var parent_id = data['parent_id'];
	
	// these are the internal representations of the nodes and links
	var nodes = force.nodes();
	var links = force.links();
	
	//console.log("Node map:")
	//console.log(nodes);
	
	// have we seen this before?
	if (nodeMap[redirection_id]) {
		// node already exists. Increment click count.
		var n = nodeMap[redirection_id];
		nodes[n].clicks = nodes[n].clicks + 1;
		
		// TODO: increment clicks in visualization too
		return;
	}

	// non-root nodes have extra checks
	if (!isRoot) {
		if (!parent_id) {
			console.log(awesm_url + " has no parent");
			return;
		}

		// is its parent part of the graph?
		if (typeof(nodeMap[parent_id]) == 'undefined') {
			console.log(awesm_url + " does not have a parent in the graph");
			return;
		}
	}

	// this is a new node
	var n = { 
		'awesm_url': awesm_url,
		'redirection_id': redirection_id,
		'parent_id': parent_id,
		'group': 1,
		'clicks': 1
	};
	
	// find out where to insert it
	var i = nodes.length;
	console.log("Adding node at index " + i);
	nodes[i] = n;
	
	// map to the node by awesm_url
	nodeMap[n['redirection_id']] = i;
	console.log("nodemap now")
	console.log(nodeMap)
	
	// create a link, if possible
	var parent = data['parent_id'];
	if (parent) {
		console.log("parent ID is " + parent);
		var sourceNode = nodes[nodeMap[data['redirection_id']]];
		var parentNode = nodes[nodeMap[data['parent_id']]];
		var l = {
			source: sourceNode,
			target: parentNode,
			value: 4
		};
		links.push(l)
	}
	
	// we do the links first so the nodes are drawn on top
	// get the svg representation of the links
	// data() appears to be an 'outer join' between new and existing nodes
	var link = svg.selectAll("line.link")
	.data(links);
	
	// append a new link to the svg.
	// I don't know what enter() is for
	var linkEnter = link.enter().append("line")
	.attr("class", "link")
	.style("stroke-width", function(d) {
		return Math.sqrt(d.value);
	});
	
	// this gets the svg representation of the nodes
	// data() appears to be an 'outer join' between new and existing nodes
	var node = svg.selectAll("g.node")
	.data(nodes);
	
	// this appends a new node to the svg set
	// still don't know what enter() is for
	var nodeEnter = node.enter().append("g")
	.attr("class", "node")
	.call(force.drag);
	
	// add a circle to the group
	nodeEnter.append("circle")
	.attr("r", 20)
	.style("fill", function(d) {
		return color(d.group);
	})

	// add a text label to the node
	// wrong: this is actually inserting the text into the circle, not what we want
	nodeEnter.append("text")
		.attr("class","nodetext")
		.attr("dx",12)
		.attr("dy",".35em")
		.text(function(d) {
		return d.awesm_url;
	});
	
	// on each tick of the model, update the svg attributes
	// to match the internal representations
	force.on("tick", function() {
		link.attr("x1", function(d) {
			return d.source.x;
		})
		.attr("y1", function(d) {
			return d.source.y;
		})
		.attr("x2", function(d) {
			return d.target.x;
		})
		.attr("y2", function(d) {
			return d.target.y;
		});

		node.attr("transform", function(d) { 
			return "translate(" + d.x + "," + d.y + ")"; 
		});
	});
	
	// kick it all off
	force.nodes(nodes)
	.links(links)
	.start();	
	
}