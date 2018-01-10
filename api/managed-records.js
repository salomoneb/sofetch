import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

/*
	REQUEST OPTIONS 
		var options = {
			page: 	INT optional - if omitted, fetch page one
			colors: [] optional - if omitted, fetch all colors 			
		}
*/
/*
	RESPONSE OBJECT 
		var obj = {
			ids: 	[] with all IDs from request
			open: [] with all disposition values of open + a "isPrimary" key to each one indicating whether they have a red, blue or yellow 			color, 
			closedPrimaryCount: INT total number of items that have a disposition of closed and contain a red, yellow, or blue color, 

		}
*/
// pass options in as param in retrieve
	// construct url using helper func
	// pass url to fetch

// TODO: REPLACE RP WITH FETCH
// Check status code in initial retrieve

function retrieve(options) {
	let records = makeUrl(options)
	rp(records).then(result => {
		// check status code here
		console.log(result)
		return result
	}).catch(error => {
		console.log("\x1b[41m\x1b[1m%s\x1b[0m", "Uh oh, there was an error.")
	})
}

function makeUrl(options) {
	let uri = URI("http://localhost:3000/records")
	uri.setSearch("limit", 10)
	if (options.page) {
		uri.setSearch("offset", (options.page - 1) * 10)
	}
	if (options.colors && options.colors.length) {
		uri.setSearch("color[]", options.colors)
	}
	return uri.href()
}

export default retrieve;
