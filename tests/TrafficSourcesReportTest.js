function testTrafficSourcesReports_(){
    const spreadsheetService = new SpreadsheetService()
	const testSpreadsheet = spreadsheetService.openOrCreateSpreadsheetFile("testTrafficSourcesReports"),
    configSheet = spreadsheetService.getOrCreateSheet(testSpreadsheet, "Config"),
    domainName = "codeporting.app",
    trafficMedium = null,
    addTotals = true,
    sendEmail = true,
    email = "boxe964hiho@post.wordpress.com" // publish to personal blog

    reportDomainTopTrafficPeriod2(configSheet, testSpreadsheet,domainName, trafficMedium, "Weekly", addTotals, sendEmail, email)
	reportDomainTopTrafficWeekly2(configSheet, testSpreadsheet, domainName, trafficMedium, addTotals, sendEmail, email)
}