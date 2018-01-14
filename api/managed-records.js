import fetch from "../util/fetch-fill";
import URI from "urijs";

window.path = "http://localhost:3000/records"

function retrieve({page, colors} = {}) {
	const fetchPromises = fetchLinkResults(page, colors)
	return promiseChain(fetchPromises, page)
}
function promiseChain(fetchPromises, page) {
	const promises = Promise.all(fetchPromises)
		.then(fetchPromises => handleResults(fetchPromises, page))
		.catch(error => {
			console.log("\x1b[31m%s%s\x1b[0m", "An error occurred processing fetched results. " , error.message)
			console.log(error)
		})
	return promises
}
function fetchLinkResults(page, colors) {
	const endpoints = getEndpointLinks(page, colors)
	const fetchedResults = endpoints.map((link, index) => {
		return fetch(link)
			.then(response => response.json())
			.catch(error => {
				console.log("\x1b[31m%s%s\x1b[0m", "A fetch call failed: ", error)
			})
	})
	return fetchedResults
}
function handleResults(results, page) {
	let pageResults, allResults
	[pageResults, allResults] = results
	const transformedResults = transform(pageResults, allResults, page)
	return transformedResults	
}
function transform(pageResults, allResults, page) {
	const finalObject = {}	
	finalObject.ids = getPageResults(pageResults)
	finalObject.open = getOpenResults(pageResults)
	finalObject.closedPrimaryCount = getClosedPrimaryCount(pageResults)
	// Pagination
	const pagination = getPagination(pageResults, allResults, page)
	let previousPage, nextPage
	({previousPage: finalObject.previousPage, nextPage: finalObject.nextPage} = pagination)
	return finalObject
}
function getPageResults(pageResults) {
	return pageResults.map(item => item.id)
}
function getOpenResults(results) {
	const openResults = results.filter(item => item.disposition === "open")
	openResults.map(item => item["isPrimary"] = testPrimary(item) ? true : false)
	return openResults
}
// Check number of closed results containing primary colors
function getClosedPrimaryCount(results) {
	const closedPrimaryColorResults = results.filter(item => item.disposition === "closed" && testPrimary(item) === true)
	return closedPrimaryColorResults.length
}
// Handle pagination conditions, return an object with pagination info
function getPagination(pageResults, allResults, page) {
	var pagination = {}
	if (pageResults.length) {	
		handleNonEmptyPages(pageResults, allResults, pagination)
	} else {
		handleEmptyPages(pageResults, allResults, pagination, page)
	}
	return pagination
}
// If there are results  
function handleNonEmptyPages(pageResults, allResults, pagination) {
	const lowestResultIndex = allResults.findIndex( item => lowIndexHelper(item, pageResults))
	const highResultIndex = allResults.findIndex( item => highIndexHelper(item, pageResults))
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
function handleEmptyPages(pageResults, allResults, pagination, page, colors) {
	const totalPages = Math.ceil(allResults.length/10)
	let pageRequested
	if (page) pageRequested = page
	if (pageRequested === (totalPages + 1)) {
		pagination["previousPage"] = totalPages 
	} else {
		pagination["previousPage"] = null 
	}
	pagination["nextPage"] = null	
	return pagination
}
// Check if our results contain a primary color
function testPrimary({color} = {}) {
	return (color === "red" || color === "blue" || color === "yellow") ? true : false
}
// Get the indices of the lowest and highest paginated results within the full results
function lowIndexHelper({id} = {}, pageResults) {
	return id === pageResults[0].id
}
function highIndexHelper({id} = {}, pageResults) {
	return id === pageResults[pageResults.length-1].id
}
// Create our initial endpoint
function constructBaseEndpoint(page, colors) {
	const baseEndpoint = URI(window.path)
	baseEndpoint.setSearch("limit", 10)
	if (page !== undefined) baseEndpoint.setSearch("offset", (page - 1) * 10)
	if (colors !== undefined) baseEndpoint.setSearch("color[]", colors)		

	return baseEndpoint
}
// Take our initial endpoint and increase the limit so we can retrieve all results
function increaseEndpoint(endpointObject) {
	endpointObject.setSearch("limit", 1000)
	if (endpointObject.hasSearch("offset")) endpointObject.removeSearch("offset")
	return endpointObject
}
// Get both endpoint URLs, return them in an array
function getEndpointLinks(page,colors) {
	const endpointObject = constructBaseEndpoint(page, colors)
	const endpoint = endpointObject.href()
	const unboundedEndpoint = increaseEndpoint(endpointObject).href()
	return [endpoint, unboundedEndpoint]
}

export default retrieve;