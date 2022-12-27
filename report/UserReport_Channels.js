/**
 * Creates a traffic channel-wise weekly report for the given domain.
 * Traffic channels are Organic Search, Referral, Direct etc.
 * 
 * @param {Sheet} configSheet a spreadsheet document sheet contaning the report configuration
 * @param {Spreadsheet} reportDataSpreadsheet a spreadsheet document containing the report data. A new spreadsheet document sheet will be added or recreated if it is already present
 * @param {string} domainName a name of domain the report traffic is generated. It is expected 2nd level domain name without protocol
 * @param {Array} trafficChannels an array of traffic channels are included to the report, or null to add any. For example, it may be an array of ['Organic Search', 'Referral','Direct','Social','(Other)'] 
 * @param {boolean} addTotals true if totals row must be added to the report
 * @param {boolean} sendEmail true if send an email
 * @param {string} emailAddress an email address the report will be sent
 */
function reportDomainTrafficChannelsWeekly2(configSheet, reportDataSpreadsheet, domainName, trafficChannels, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService() 
  const config = new ReportConfig(configSheet, reportDataSpreadsheet)
  config.setTrafficChannels(trafficChannels)
    .setDomain(domainName)
    .setHasTotals(addTotals)
    .setEmailAddress(emailAddress)
    .setCanSendEmail(sendEmail)
    .setReportInfo(false, 'channels', domainName)
    .setWpCategory("Weekly Reports")

  //Create unique sheet name
  const sheetName = `channels-Current-${domainName}`,
    reportDataSheet = spreadsheetService.recreateReportSheet(reportDataSpreadsheet, sheetName), 
    gaPropertyId = config.getGAPropertyId(),
    topLimit = config.getTopLimit()

  let channelField = 'sessionDefaultChannelGroup' //'sessionDefaultChannelGroup' //defaultChannelGroup 
  const headerMap = {
    'Traffic Channel': channelField,
    //'SessionMedium': 'sessionMedium',
    //'HostName': 'hostName',
    'Users': 'totalUsers',
    'New Users': 'newUsers',
    'Sessions': 'sessions',
    'Bounce Rate': 'bounceRate',
    'Avg. Session Duration': 'averageSessionDuration',
    'Pages/Session': 'screenPageViewsPerSession',
    'Last Run On': 'lastRun'
  }

  // Document renderer inserts data to Google Sheet 
  let renderer = new DocumentReportRenderer(config, reportDataSheet, headerMap)
  renderer.renderHeader()

  let builder = createWeeklyReportDataBuilder_()
  builder
    .addDimension(channelField)
    .setDimensionFilter(new StringFilterFactory().createOneOfFilter(channelField, config.getTrafficChannels()))
    .setLimit(topLimit)
    .setOrderBy(new OrderByCollectionBuilder().addDimensionOrderBy('totalUsers', true))

  // Data source retrieves data from Google Analytics 4 property
  const dataSource = new ReportDataSource(gaPropertyId, builder.build())

  // rows is an array of row map: [{Map},[Map]]
  let rows = dataSource.getObjectRows();
  if (rows.length == 0) {
    dataSource.populateWithDefaults(rows)
    rows[0].set(channelField, '')
    config.setHasTotals(false)
  }
  
  renderer.render(2, rows, config)

  //Round decimal figures by two
  reportDataSheet.getRange(2, 2, reportDataSheet.getLastRow() - 1, 5).setNumberFormat("0.##");

  const htmlRenderer = new HtmlReportRenderer(reportDataSheet, 'template/TmplWeeklyReport.html', headerMap)

  //let htmlReport = htmlRenderer.render(rows, ['Last Run On'])
  htmlReport = htmlRenderer.renderFromSheetData(config.hasTotals(), ['Last Run On'])

  const delivery = new ReportDelivery(config)
  let subjectOrFileName = `Weekly ${domainName} Channels Traffic – Current – ${Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyy.MM.dd')}`
  delivery.deliverReport(htmlReport, subjectOrFileName)
}

/**
 * Creates a traffic channel-wise weekly report for the given domain.
 * Traffic channels are Organic Search, Referral, Direct etc.
 * 
 * @param {Object} configDocId (string) - (Required) ID of the google spreadsheet. You can get it from spreadsheet URL: https://docs.google.com/spreadsheets/d/<sourceSheetID>/.
 * @param {Object} configSheetName (string) - (Required) Name of the sheet containing websites' data/filters etc.
 * @param {Object} domainName (string) - (Required) Just pass top-level domain like "abc.com" without http/https or sub-domains.
 * @param {Object} trafficChannels (array) - (Required) Create an array of traffic channels like this: 
 * channels = ['Organic Search', 'Referral','Direct','Social','(Other)'] and then pass channels object as parameter. If not sure then just pass empty "" string
 * @param {Object} addTotals (true/false) - (Optional, default is true) Whether to add totals of the columns in the last row or not.
 * @param {Object} sendEmail (true/false) - (Optional, default is false) Whether to send report as email or not. When false, report is saved 
 * as TXT file in html to google drive.
 * @param {Object} emailAddress (string) - Email address where report has to be sent
 */
function reportDomainTrafficChannelsWeekly(configDocId, configSheetName, domainName, trafficChannels, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService()
  const configSheet = spreadsheetService.getSheetByDocIdAndName(configDocId, configSheetName)
  reportDomainTrafficChannelsWeekly2(configSheet, SpreadsheetApp.getActive(), domainName, trafficChannels, addTotals, sendEmail, emailAddress)
}

/**
 * Creates a traffic channel-wise report for the specified period for the given domain based on weekly data of 
 * Today,1W,1M,3M,6M & 12M where W stands for Week and M for Month.
 *
 * @param {Sheet} configSheet a spreadsheet document sheet contaning the report configuration
 * @param {Spreadsheet} reportDataSpreadsheet a spreadsheet document containing the report data. A new spreadsheet document sheet will be added or recreated if it is already present
 * @param {string} domainName a name of domain the report traffic is generated. It is expected 2nd level domain name without protocol
 * @param {Array} trafficChannels an array of traffic channels are included to the report, or null to add any. For example, it may be an array of ['Organic Search', 'Referral','Direct','Social','(Other)'] 
 * @param {string} period a period of the report. Use "Weekly", "Monthly", Quarterly, "Semiannual" or "Annual" as value.
 * @param {boolean} addTotals true if totals row must be added to the report
 * @param {boolean} sendEmail true if send an email
 * @param {string} emailAddress an email address the report will be sent
 */
function reportDomainTrafficChannelsPeriod2(configSheet, reportDataSpreadsheet, domainName, trafficChannels, period, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService()
  const config = new ReportConfig(configSheet, reportDataSpreadsheet)
  config.setTrafficChannels(trafficChannels)
    .setPeriod(period)
    .setHasTotals(addTotals)
    .setCanSendEmail(sendEmail)
    .setEmailAddress(emailAddress)
    .setDomain(domainName)
    .setWpCategory(`${config.getPeriod()} Reports`)

  //Create unique sheet name based on period (Weekly, Monthly, Semiannual etc.) and website (aspose.com, groupdocs.com etc)
  const sheetName = `channels-${period}-Historic-${domainName}`,
    reportDataSheet = spreadsheetService.recreateReportSheet(reportDataSpreadsheet, sheetName),
    gaPropertyId = config.getGAPropertyId(),
    topLimit = config.getTopLimit(),
    dateRange = new ReportPeriodBuilder(config.getPeriod()).build(), // range of dates with labels
    renderer = new DocumentReportRenderer(config, reportDataSheet)

  const field = 'sessionDefaultChannelGroup'  

  // Setup report header  
  renderer.addHeader("Traffic Channels", field)
  dateRange.forEach(i=>{
    renderer.addHeader(i[2],i[2])
  })
  renderer.addHeader('Last Run On', 'lastRun')
  renderer.renderHeader()
  
  const dataBuilder = new ReportDataBuilder()
  dataBuilder
    .addMetric("totalUsers")
    .addDimension(field)
  
  let reportData = []
  for (i = 0; i < config.getTrafficChannels().length; i++) {
    let trafficChannel = config.getTrafficChannels()[i],
    rowObject = new Map()
    
    reportData.push(rowObject)
    rowObject.set(field, trafficChannel)
    
    dataBuilder.setDimensionFilter(
      new StringFilterFactory().createStringEqualsFilter(field, trafficChannel, false))    

    //Get historic data for specific website section
    for (k = 0; k < dateRange.length; k++) {
      let period = dateRange[k]
    
      //get total users
      dataBuilder.setDateRange(period[0], period[1])
      
      const dataSource = new ReportDataSource(gaPropertyId, dataBuilder.build())
      let rowsOfObject = dataSource.getObjectRows()

      rowObject.set(period[2], rowsOfObject[0] ? rowsOfObject[0].get('totalUsers') : 0)
    }
  }
  
  renderer.render(2, reportData, config)
  
  const subjectOrFileName = `${config.getPeriod()} ${config.getDomain()} Channels Traffic – Historic – ${Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyy.MM.dd')}`,
    htmlRenderer = new HtmlReportRenderer(reportDataSheet, 'template/TmplWeeklyReport.html', renderer.headerMap),
    delivery = new ReportDelivery(config)
  
  //let htmlReport = htmlRenderer.render(rows, ['Last Run On'])
  htmlReport = htmlRenderer.renderFromSheetData(config.hasTotals(), ['Last Run On'])
  delivery.deliverReport(htmlReport, subjectOrFileName)
}

/**
 * Creates a traffic channel-wise report for the specified period for the given domain based on weekly data of 
 * Today,1W,1M,3M,6M & 12M where W stands for Week and M for Month.
 * 
 * @param {Object} configDocId (string) - (Required) ID of the google spreadsheet. You can get it from spreadsheet URL: https://docs.google.com/spreadsheets/d/<sourceSheetID>/.
 * @param {Object} configSheetName (string) - (Required) Name of the sheet containing websites' data/filters etc.
 * @param {Object} domainName (string) - (Required) Just pass top-level domain like "abc.com" without http/https or sub-domains.
 * @param {Object} trafficChannels (array) - (Required) Create an array of traffic channels like this: 
 * channels = ['Organic Search', 'Referral','Direct','Social','(Other)'] and then pass channels object as parameter. If not sure then just pass empty "" string
 * @param {Object} period (string) - (Required) Use "Weekly", "Monthly", Quarterly, "Semiannual" or "Annual" as value.
 * @param {Object} addTotals (true/false) - (Optional, default is true) Whether to add totals of the columns in the last row or not.
 * @param {Object} sendEmail (true/false) - (Optional, default is false) Whether to send report as email or not. When false, report is saved 
 * as TXT file in html to google drive.
 * @param {Object} emailAddress (string) - Email address where report has to be sent
 */
function reportDomainTrafficChannelsPeriod(configDocId, configSheetName, domainName, trafficChannels, period, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService()
  const configSheet = spreadsheetService.getSheetByDocIdAndName(configDocId, configSheetName)
  reportDomainTrafficChannelsPeriod2(configSheet, SpreadsheetApp.getActive(), domainName, trafficChannels, period, addTotals, sendEmail, emailAddress)
}
