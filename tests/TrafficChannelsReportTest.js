function testTrafficChannelsReports_(){
    const spreadsheetService = new SpreadsheetService()
    const testSpreadsheet = spreadsheetService.openOrCreateSpreadsheetFile("testTrafficChannelsReports"),
    configSheet = spreadsheetService.getOrCreateSheet(testSpreadsheet, "Config"),
    trafficChannels = null,
    addTotals = true,
    sendEmail = true

    reportDomainTrafficChannelsPeriod2(configSheet, testSpreadsheet, testDomainName, trafficChannels, "Weekly", addTotals, sendEmail, testPostByEmail)
    reportDomainTrafficChannelsWeekly2(configSheet, testSpreadsheet, testDomainName, trafficChannels, addTotals, sendEmail, testPostByEmail)
}