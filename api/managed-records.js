import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

function retrieve(options) {
	let uriObject = createUri(options)
	let endpoint = uriObject.href()
	let unboundedEndpoint = increaseEndpoint(uriObject).href()
	let results = fetchLinkResults(endpoint, unboundedEndpoint)
	
	return Promise.all(results)
		.then(allResults => handleResults(allResults))
		.catch(error => console.error(error))
}
function fetchLinkResults(endpoint, unboundedEndpoint) {
	let fetchedResults =[endpoint, unboundedEndpoint].map(link => {
		return fetch(link)
		.then(response => response.json())
		.then(jsonResponse => jsonResponse)
	})
	return fetchedResults
}
function handleResults(results) {
	let pageResults = results[0]
	let allResults = results[1]
	let transformedResults = transform(pageResults, allResults)
	return transformedResults	
}
function transform(pageResults, allResults) {
	let finalObject = {}
	let pagination = getPagination(pageResults, allResults)
	finalObject["ids"] = pageResults.map(item => item.id)
	finalObject["open"] = getOpenResults(pageResults)
	finalObject["closedPrimaryCount"] = getClosedPrimaryCount(pageResults)	
	finalObject["previousPage"] = pagination.previousPage
	finalObject["nextPage"] = pagination.nextPage
	return finalObject
}
function createUri(options) {
	let uri = URI("http://localhost:3000/records")
	uri.setSearch("limit", 10)
	if (options) {
		if (options.page) { uri.setSearch("offset", (options.page - 1) * 10) }
		if (options.colors && options.colors.length) { uri.setSearch("color[]", options.colors) }		
	}
	return uri
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
function increaseEndpoint(uriObject) {
	uriObject.setSearch("limit", 1000)
	if (uriObject.hasSearch("offset")) { uriObject.removeSearch("offset") }
	return uriObject
}

export default retrieve;
