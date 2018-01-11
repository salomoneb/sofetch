import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

let options = {
	colors: ["red"]
}

retrieve(options)

function retrieve(options) {
	let endpointObject = createUri(options)
	let endpoint = endpointObject.href()
	let unboundedEndpoint = unboundEndpoint(endpointObject).href()
	console.log(endpoint, "\n", unboundedEndpoint)
	Promise.all([rp(endpoint), rp(unboundedEndpoint)]) // replace with fetch
		.then(results => {
			// check status code here
			let pageResults = JSON.parse(results[0]) // remove json.parse if necessary
			let allResults = JSON.parse(results[1])
			let transformedResults = {}
			transform(pageResults, allResults, transformedResults)
			console.log(transformedResults)
			return transformedResults
		})
		.catch(error => { console.log("\x1b[31m%s%s\x1b[0m", "Error: ", error.message, error) })
}
function createUri(options) {
	let uri = URI("http://localhost:3000/records")
	uri.setSearch("limit", 10)
	if (options.page) { uri.setSearch("offset", (options.page - 1) * 10) }
	if (options.colors && options.colors.length) { uri.setSearch("color[]", options.colors) }
	return uri
}
function transform(pageResults, allResults, transformObject) {
	let pagination = getPagination(pageResults, allResults)
	transformObject["ids"] = pageResults.map(item => item.id)
	transformObject["open"] = getOpenResults(pageResults)
	transformObject["closedPrimaryCount"] = getClosedPrimaryCount(pageResults)	
	transformObject["previousPage"] = pagination.previousPage
	transformObject["nextPage"] = pagination.nextPage
	return transformObject
}

/* ------ Helper Functions ------ */
function getOpenResults(results) {
	let openResults = results.filter(item => item.disposition === "open")
	openResults.map(item => item["isPrimary"] = testPrimary(item) ? true : false)
	return openResults
}
function getClosedPrimaryCount(results) {
	let closedPrimaryColorResults = results.filter(item => item.disposition === "closed" && testPrimary(item) === true)
	return closedPrimaryColorResults.length
}
function testPrimary(item) {
	return (item.color === "red" || item.color === "blue" || item.color === "yellow") ? true : false
}
function getPagination(pageResults, allResults) {
	var pagination = {}
	if (pageResults.length) {	
		let lowestResultIndex = allResults.findIndex( item => lowIndexHelper(item, pageResults))
		let highResultIndex = allResults.findIndex( item => highIndexHelper(item, pageResults))
		
		// Check low results
		if (lowestResultIndex < 10 || lowestResultIndex === -1) {
			pagination["previousPage"] = null
		} else {
			pagination["previousPage"] = Math.floor(lowestResultIndex / 10)
		}
		// Check high results
		if (highResultIndex === allResults.length - 1 || highResultIndex === -1) {
			pagination["nextPage"] = null
		} else {
			pagination["nextPage"] = Math.floor(highResultIndex / 10) + 2
		}
	} else {
		pagination = {
			previousPage: null, 
			nextPage: null
		}
	}
	return pagination
}

// These find the indices of the lowest and highest paginated results within the full results
function lowIndexHelper(item, pageResults) {
	return item.id === pageResults[0].id
}
function highIndexHelper(item, pageResults) {
	return item.id === pageResults[pageResults.length-1].id
}
function unboundEndpoint(endpointObject) {
	endpointObject.setSearch("limit", 1000)
	if (endpointObject.hasSearch("offset")) { endpointObject.removeSearch("offset") }
	return endpointObject
}

export default retrieve;
