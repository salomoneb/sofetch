import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

let options = {
	page: 49	
}

// REPLACE RP WITH FETCH

retrieve(options)

function retrieve(options) {
	let endpointObject = createUri(options)
	let endpoint = endpointObject.href()
	rp(endpoint)
		.then(results => {
			console.log(endpoint)
			// check status code here
			results = JSON.parse(results) // remove this line in final version
			// let transformedData = transform(results)
			// console.log(transformedData)
			getPageCounts(results, endpointObject)				
		})
		.catch(error => { console.log("\x1b[41m\x1b[1m%s\x1b[0m", "Uh oh, there was an error.\n", error.message) })
}
function transform(results) {
	let transformedResults = {} || transformedResults
	transformedResults["ids"] = results.map(item => item.id)
	transformedResults["open"] = getOpenResults(results)
	transformedResults["closedPrimaryCount"] = getClosedPrimaryCount(results)

	return transformedResults
}
function getOpenResults(results) {
	let openResults = results.filter(item => item.disposition === "open")
	openResults.map(item => item["isPrimary"] = testPrimary(item) ? true : false)
	return openResults
}
function getClosedPrimaryCount(results) {
	let closedPrimaryColorResults = results.filter(item => item.disposition === "closed" && testPrimary(item) === true)
	return closedPrimaryColorResults
}
function testPrimary(item) {
	return (item.color === "red" || item.color === "blue" || item.color === "yellow") ? true : false
}
function getPageCounts(results, endpointObject, options) {
	let unboundedEndpoint = unboundEndpoint(endpointObject).href()
	console.log(unboundedEndpoint)
	rp(unboundedEndpoint)
		.then(fullResults => {
			fullResults = JSON.parse(fullResults)
			let fullResultsLength = fullResults.length
			// let lowResultIndex = fullResults.findIndex(function(item) {
			// 	return item.id === results[0].id
			// })
			// console.log(lowResultIndex)


			// let highResultIndex = fullResults.findIndex( item => findHighestIndex(item, results))

			// let pages = {}
			// if (lowResultIndex < 10 || lowResultIndex === -1){
			// 	pages["previousPage"] = null
			// } else {
			// 	pages["previousPage"] = Math.floor(lowResultIndex / 10)
			// }
			// if (highResultIndex === fullResults.length || highResultIndex === -1) {
			// 	pages["nextPage"] = null
			// } else {
			// 	pages["nextPage"] = pages.previousPage + 2
			// }
			// console.log(pages) 
		})
		.catch(error => {console.log("error")})
}

function findLowestIndex(item, results) {
	return item.id === results[0].id
}
function findHighestIndex(item, results) {
	return item.id === results[results.length-1].id
}
function unboundEndpoint(endpointObject) {
	if (endpointObject.hasSearch("offset")) { endpointObject.removeSearch("offset") }
	if (endpointObject.hasSearch("limit")) { endpointObject.removeSearch("limit") }
	return endpointObject
}
function createUri(options) {
	let uri = URI("http://localhost:3000/records")
	uri.setSearch("limit", 10)
	if (options.page) { uri.setSearch("offset", (options.page - 1) * 10) }
	if (options.colors && options.colors.length) { uri.setSearch("color[]", options.colors) }
	return uri
}




			// let pages = {}
			// if (lowResultIndex < 10 || lowResultIndex === -1){
			// 	pages["previousPage"] = null
			// } else {
			// 	pages["previousPage"] = Math.floor(lowResultIndex / 10)
			// }
			// if (highResultIndex === fullResults.length || highResultIndex === -1) {
			// 	pages["nextPage"] = null
			// } else {
			// 	pages["nextPage"] = pages.previousPage + 2
			// } 
			// console.log(pages)

export default retrieve;
