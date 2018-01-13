import fetch from "../util/fetch-fill";
import URI from "urijs";

window.path = "http://localhost:3000/records"

function retrieve(options) {
	let fetchPromises = fetchLinkResults(options)
	return promiseChain(fetchPromises, options)
}
function promiseChain(fetchPromises, options) {
	let promises = Promise.all(fetchPromises)
		.then(fetchPromises => handleResults(fetchPromises, options))
		.catch(error => {
			console.log("\x1b[31m%s%s\x1b[0m", "An error occurred processing fetched results. " , error.message)
			console.log(error)
		})
	return promises
}
function fetchLinkResults(options) {
	let endpoints = getEndpointLinks(options)
	let fetchedResults = endpoints.map((link, index) => {
		return fetch(link)
			.then(response => response.json())
			.catch(error => {
				console.log("\x1b[31m%s%s\x1b[0m", "A fetch call failed: ", error)
			})
	})
	return fetchedResults
}
function handleResults(results, options) {
	let pageResults, allResults
	[pageResults, allResults] = results
	let transformedResults = transform(pageResults, allResults, options)
	return transformedResults	
}
function transform(pageResults, allResults, options) {
	let finalObject = {}
	let pagination = getPagination(pageResults, allResults, options)
	finalObject["ids"] = pageResults.map(item => item.id)
	finalObject["open"] = getOpenResults(pageResults)
	finalObject["closedPrimaryCount"] = getClosedPrimaryCount(pageResults)	
	finalObject["previousPage"] = pagination.previousPage
	finalObject["nextPage"] = pagination.nextPage
	return finalObject
}
function getOpenResults(results) {
	let openResults = results.filter(item => item.disposition === "open")
	openResults.map(item => item["isPrimary"] = testPrimary(item) ? true : false)
	return openResults
}
// Check number of closed results containing primary colors
function getClosedPrimaryCount(results) {
	let closedPrimaryColorResults = results.filter(item => item.disposition === "closed" && testPrimary(item) === true)
	return closedPrimaryColorResults.length
}
// Handle pagination conditions, return an object with pagination info
function getPagination(pageResults, allResults, options) {
	var pagination = {}
	if (pageResults.length) {	
		handleNonEmptyPages(pageResults, allResults, pagination)
	} else {
		handleEmptyPages(pageResults, allResults, options, pagination)
	}
	return pagination
}
// If there are results  
function handleNonEmptyPages(pageResults, allResults, pagination) {
	let lowestResultIndex = allResults.findIndex( item => lowIndexHelper(item, pageResults))
	let highResultIndex = allResults.findIndex( item => highIndexHelper(item, pageResults))
	if (lowestResultIndex < 10 || lowestResultIndex === -1) {
		pagination["previousPage"] = null
	} else {
		pagination["previousPage"] = Math.floor(lowestResultIndex / 10)
	}
	if (highResultIndex === allResults.length - 1 || highResultIndex === -1) {
		pagination["nextPage"] = null
	} else {
		pagination["nextPage"] = Math.floor(highResultIndex / 10) + 2
	}	
	return pagination
}
// If there are no results
function handleEmptyPages(pageResults, allResults, options, pagination) {
	let totalPages = Math.ceil(allResults.length/10)
	let pageRequested
	if (options && options.page) {
		pageRequested = options.page
	}
	if (pageRequested === (totalPages + 1)) {
		pagination["previousPage"] = totalPages 
	} else {
		pagination["previousPage"] = null 
	}
	pagination["nextPage"] = null	
	return pagination
}
// Check if our results contain a primary color
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
// Create our initial endpoint
function constructBaseEndpoint(options) {
	let baseEndpoint = URI(window.path)
	baseEndpoint.setSearch("limit", 10)
	if (options) {
		if (options.page) baseEndpoint.setSearch("offset", (options.page - 1) * 10)
		if (options.colors && options.colors.length) baseEndpoint.setSearch("color[]", options.colors)		
	}
	return baseEndpoint
}
// Take our initial endpoint and increase the limit so we can retrieve all results
function increaseEndpoint(endpointObject) {
	endpointObject.setSearch("limit", 1000)
	if (endpointObject.hasSearch("offset")) endpointObject.removeSearch("offset")
	return endpointObject
}
// Get both endpoint URLs, return them in an array
function getEndpointLinks(options) {
	let endpointObject = constructBaseEndpoint(options)
	let endpoint = endpointObject.href()
	let unboundedEndpoint = increaseEndpoint(endpointObject).href()
	return [endpoint, unboundedEndpoint]
}

export default retrieve;
