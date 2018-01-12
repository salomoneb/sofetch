import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

let options = {
	page: 10,
	colors: ["red", "blue"]
}

retrieve(options).then(result => console.log(result))

function retrieve(options) {
	let endpointObject = createUri(options)
	let endpoint = endpointObject.href()
	let unboundedEndpoint = increaseEndpoint(endpointObject).href()
	return callApi(endpoint, unboundedEndpoint)
}
function callApi(endpoint, unboundedEndpoint) {
	return Promise.all([rp(endpoint), rp(unboundedEndpoint)]) // replace with fetch
		.then(results => handleResults(results))
		.catch(error => console.log("\x1b[31m%s%s\x1b[0m", "Received the following error: \n\n", error.message))
}
function handleResults(results) {
	// check status code here
	let pageResults = JSON.parse(results[0]) // remove json.parse if necessary
	let allResults = JSON.parse(results[1])
	let transformedResults = {}
	transform(pageResults, allResults, transformedResults)
	return transformedResults	
}
function createUri(options) {
	let uri = URI("http://localhost:3000/records")
	uri.setSearch("limit", 10)
	if (options.page) { uri.setSearch("offset", (options.page - 1) * 10) }
	if (options.colors && options.colors.length) { uri.setSearch("color[]", options.colors) }
	return uri
}
function transform(pageResults, allResults, transformedResults) {
	let pagination = getPagination(pageResults, allResults)
	transformedResults["ids"] = pageResults.map(item => item.id)
	transformedResults["open"] = getOpenResults(pageResults)
	transformedResults["closedPrimaryCount"] = getClosedPrimaryCount(pageResults)	
	transformedResults["previousPage"] = pagination.previousPage
	transformedResults["nextPage"] = pagination.nextPage
	return transformedResults
}
function getOpenResults(results) {
	let openResults = results.filter(item => item.disposition === "open")
	openResults.map(item => item["isPrimary"] = testPrimary(item) ? true : false)
	return openResults
}
function getClosedPrimaryCount(results) {
	let closedPrimaryColorResults = results.filter(item => item.disposition === "closed" && testPrimary(item) === true)
	return closedPrimaryColorResults.length
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
/* ------ SMALL HELPERS ------ */
function testPrimary(item) {
	return (item.color === "red" || item.color === "blue" || item.color === "yellow") ? true : false
}
// Get the indices of the lowest and highest paginated results within the full results
function lowIndexHelper(item, pageResults) {
	return item.id === pageResults[0].id
}
function highIndexHelper(item, pageResults) {
	return item.id === pageResults[pageResults.length-1].id
}
// Increase the endpoint limit so we can fetch all results
function increaseEndpoint(endpointObject) {
	endpointObject.setSearch("limit", 1000)
	if (endpointObject.hasSearch("offset")) { endpointObject.removeSearch("offset") }
	return endpointObject
}

export default retrieve;
