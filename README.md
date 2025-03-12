# queueclient

Queue client to fetch pending runs for speedrun.com games, inspired
by randomidiot13/queueclient-web.

**Live version**: https://akleemans.github.io/queueclient/

### Features

* Fetch modes: Full (up to 20k runs) and fast (fast fetching of first 1000 runs)
* Filter by category, video type, or arbitrary text filter
* Display of subcategories
* Sorting by any attribute, for example Submitted date
* Default sort order groups runs of same user together (oldest submission first)
* Duplicate detection
* Direct link to video (and run submission) in list
* Export as CSV or XLSX
* Shareable link with `gameId` in URL, e.g. https://akleemans.github.io/queueclient/?gameId=subsurf
* Throttling to comply with speedrun.com's API usage guidelines


![queueclient](https://raw.githubusercontent.com/akleemans/queueclient/refs/heads/main/queueclient.png)

