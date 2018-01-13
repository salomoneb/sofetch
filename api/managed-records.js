import fetch from "../util/fetch-fill";
import URI from "urijs";

window.path = "http://localhost:3000/records"

function retrieve(options) {
	let fetchPromises = fetchLinkResults(options)
	return Promise.all(fetchPromises)
		.then(fetchPromises => handleResults(fetchPromises, options))
		.then(allResults => allResults)
		.catch(error => {
			console.log("error three")
			return error
		})
}
function fetchLinkResults(options) {
	let endpoints = getEndpointLinks(options)
	let fetchedResults = endpoints.map((link, index) => {
		return fetch(link)
			.then(response => {
				if (!response.ok) console.log("ok")
				// if (!response.ok) {
				// 	console.log("error one")
				// 	if (index === 0) {
				// 		return fetch("http://localhost:3000/records?limit=10")						
				// 	}
				// 	if (index === 1) {
				// 		return fetch("http://localhost:3000/records?limit=1000")	
				// 	}
				// }
				return response
			})
			.then(response => response.json())
			.catch(error => {
				console.log("error two")
				return error
			})
	})
	return fetchedResults
}
function handleResults(results, options) {
	let pageResults = results[0]
	let allResults = results[1]
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
function getEndpointLinks(options) {
	let endpointObject = constructBaseEndpoint(options)
	let endpoint = endpointObject.href()
	let unboundedEndpoint = increaseEndpoint(endpointObject).href()
	let endpointLinks = [endpoint, unboundedEndpoint]
	return endpointLinks
}
function constructBaseEndpoint(options) {
	let baseEndpoint = URI(window.path)
	baseEndpoint.setSearch("limit", 10)
	if (options) {
		if (options.page) { baseEndpoint.setSearch("offset", (options.page - 1) * 10) }
		if (options.colors && options.colors.length) { baseEndpoint.setSearch("color[]", options.colors) }		
	}
	return baseEndpoint
}
function increaseEndpoint(endpointObject) {
	endpointObject.setSearch("limit", 1000)
	if (endpointObject.hasSearch("offset")) { endpointObject.removeSearch("offset") }
	return endpointObject
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
function getPagination(pageResults, allResults, options) {
	var pagination = {}
	let totalPages = Math.ceil(allResults.length/10)
	let pageRequested
	if (options && options.page) pageRequested = options.page
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
	} 
	else {
		if (pageRequested === (totalPages + 1)) {
			pagination = {
				previousPage: totalPages, 
				nextPage: null
			}
		} else {
			pagination = {
				previousPage: null, 
				nextPage: null
			}			
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

export default retrieve;
