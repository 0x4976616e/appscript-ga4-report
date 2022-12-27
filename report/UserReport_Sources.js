/**
 * Creates a weekly report containing top of traffic sources/mediums for the given domain.
 * 
 * @param {Object} configSheet (Sheet) - (Required) ID of the google spreadsheet. You can get it from spreadsheet URL: https://docs.google.com/spreadsheets/d/<sourceSheetID>/.
 * @param {Object} reportDataSpreadsheet (Spreadsheet) - (Required) Name of the sheet containing websites' data/filters etc.
 * @param {Object} domainName (string) - (Required) Just pass top-level domain like "abc.com" without http/https or sub-domains.
 * @param {Object} trafficMedium (string) - (Required) Use values like "organic", "referral" or "total" for organic, referral or total traffic. 
 * generated based on Source / Medium. If "kb" is used then Top Traffic report will be generated based on KB topics/landing pages.
 * @param {Object} addTotals (true/false) - (Optional, default is true) Whether to add totals of the columns in the last row or not.
 * @param {Object} sendEmail (true/false) - (Optional, default is false) Whether to send report as email or not. When false, report is saved 
 * as TXT file in html to google drive.
 * @param {Object} emailAddress (string) - Email address where report has to be sent
 */
function reportDomainTopTrafficWeekly2(configSheet, reportDataSpreadsheet, domainName, trafficMedium, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService()
  const config = new ReportConfig(configSheet, reportDataSpreadsheet)
  config.setTrafficMedium(trafficMedium)
    .setDomain(domainName)
    .setHasTotals(addTotals)
    .setEmailAddress(emailAddress)
    .setCanSendEmail(sendEmail)
    .setReportInfo(false, 'current top', domainName)
    .setWpCategory("Weekly Reports") 
 
  //Create unique sheet name
  const sheetName = `${config.getTrafficMedium()}-Top Traffic Current-${config.getDomain()}`,
    reportDataSheet = spreadsheetService.recreateReportSheet(reportDataSpreadsheet, sheetName), 
    gaPropertyId = config.getGAPropertyId(),
    topLimit = config.getTopLimit()

  const headerMap = {
    'Source / Medium': 'sessionSourceMedium',
    //'HostName': 'hostName',
    'Users': 'totalUsers',
    'New Users': 'newUsers',
    'Sessions': 'sessions',
    'Bounce Rate': 'bounceRate',
    'Avg. Session Duration': 'averageSessionDuration',
    'Pages/Session': 'screenPageViewsPerSession',
    'Last Run On': 'lastRun'
  }
 
  let dataBuilder = createWeeklyReportDataBuilder_()
  dataBuilder
    .addDimension('sessionSourceMedium')
    //.setLimit(topLimit)
    //.setOrderBy(new OrderByCollectionBuilder().addMetricOrderBy('totalUsers', true))
 
  //If trafficMedium = total then remove medium filter
  if (config.getTrafficMedium() != "total") {
    const trafficMediumFilter = new StringFilterFactory().createStringEqualsFilter("sessionMedium", config.getTrafficMedium(), false)
    dataBuilder
      //.addDimension("sessionMedium")
      .setDimensionFilter(trafficMediumFilter)
  }
  
  // Document renderer inserts data to Google Sheet 
  let renderer = new DocumentReportRenderer(config, reportDataSheet, headerMap)
  renderer.renderHeader()

  // Data source retrieves data from Google Analytics 4 property
  const dataSource = new ReportDataSource(gaPropertyId, dataBuilder.build())

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
  let subjectOrFileName = `Weekly ${config.getDomain()} Top ${topLimit} ${config.getTrafficMediumCapitalized()} Traffic – Current – ${Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyy.MM.dd')}`
  delivery.deliverReport(htmlReport, subjectOrFileName)
}

/**
 * Creates a weekly report containing top of traffic sources/mediums for the given domain.
 * 
 * @param {Object} configDocId (string) - (Required) ID of the google spreadsheet. You can get it from spreadsheet URL: https://docs.google.com/spreadsheets/d/<sourceSheetID>/.
 * @param {Object} configSheetName (string) - (Required) Name of the sheet containing websites' data/filters etc.
 * @param {Object} domainName (string) - (Required) Just pass top-level domain like "abc.com" without http/https or sub-domains.
 * @param {Object} trafficMedium (string) - (Required) Use values like "organic", "referral" or "total" for organic, referral or total traffic. 
 * generated based on Source / Medium. If "kb" is used then Top Traffic report will be generated based on KB topics/landing pages.
 * @param {Object} addTotals (true/false) - (Optional, default is true) Whether to add totals of the columns in the last row or not.
 * @param {Object} sendEmail (true/false) - (Optional, default is false) Whether to send report as email or not. When false, report is saved 
 * as TXT file in html to google drive.
 * @param {Object} emailAddress (string) - Email address where report has to be sent
 */
function reportDomainTopTrafficWeekly(configDocId, configSheetName, domainName, trafficMedium, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService()
  const configSheet = spreadsheetService.getSheetByDocIdAndName(configDocId, configSheetName)
  reportDomainTopTrafficWeekly2(configSheet, SpreadsheetApp.getActive(), domainName, trafficMedium, addTotals, sendEmail, emailAddress)
}

/**
 * Creates a report containing top of traffic sources/mediums for the given domain and period.
 * 
 * @param {Object} configSheet (Sheet) - (Required) ID of the google spreadsheet. You can get it from spreadsheet URL: https://docs.google.com/spreadsheets/d/<sourceSheetID>/.
 * @param {Object} reportDataSpreadsheet (Spreadsheet) - (Required) Name of the sheet containing websites' data/filters etc.
 * @param {Object} domainName (string) - (Required) Just pass top-level domain like "abc.com" without http/https or sub-domains.
 * @param {Object} trafficMedium (string) - (Required) Use values like "organic", "referral" or "total" for organic, referral or total traffic.
 * @param {Object} period (string) - (Required) Use "Weekly", "Monthly", Quarterly, "Semiannual" or "Annual" as value.
 * @param {Object} addTotals (true/false) - (Optional, default is false) Whether to add totals of the columns in the last row or not.
 * @param {Object} sendEmail (true/false) - (Optional, default is false) Whether to send report as email or not. When false, report is saved 
 * as TXT file in html to google drive.
 * @param {Object} emailAddress (string) - Email address where report has to be sent
 */
function reportDomainTopTrafficPeriod2(configSheet, reportDataSpreadsheet, domainName, trafficMedium, period, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService()
  const config = new ReportConfig(configSheet, reportDataSpreadsheet)
  config.setTrafficMedium(trafficMedium)
    .setPeriod(period)
    .setHasTotals(addTotals)
    .setCanSendEmail(sendEmail)
    .setEmailAddress(emailAddress)
    .setDomain(domainName)
    .setWpCategory(`${config.getPeriod()} Reports`)

  //Create unique sheet name based on period (Weekly, Monthly, Semiannual etc.) and website (aspose.com, groupdocs.com etc)
  const sheetName = `${config.getTrafficMedium()}-Top Traffic ${period} Historic-${domainName}`,
    sheet = spreadsheetService.recreateReportSheet(reportDataSpreadsheet, sheetName),
    gaPropertyId = config.getGAPropertyId(),
    topLimit = config.getTopLimit(),
    dateRange = new ReportPeriodBuilder(config.getPeriod()).build(), // range of dates with labels
    renderer = new DocumentReportRenderer(config, sheet)

  const field = 'sessionSourceMedium' 
  // Setup report header  
  renderer.addHeader("Source / Medium", field)
  dateRange.forEach(i=>{
    renderer.addHeader(i[2],i[2])
  })
  renderer.addHeader('Last Run On', 'lastRun')
  renderer.renderHeader()

  const dataBuilder = new ReportDataBuilder()
  dataBuilder
    .addMetric("totalUsers")
    .addDimension(field)
   
  if(config.getTrafficMedium() != "total")
    dataBuilder.setDimensionFilter(
        new StringFilterFactory().createStringEqualsFilter("sessionMedium", config.getTrafficMedium(), false))

  const reportData = []
  let keysMap = new Map()
  //Get historic data for specific website section
  for (k = 0; k < dateRange.length; k++) {
    const period = dateRange[k]
  
    //get total users
    dataBuilder
      .setDateRange(period[0], period[1])
      
    const dataSource = new ReportDataSource(gaPropertyId, dataBuilder.build())
    let rowsOfObject = dataSource.getObjectRows()
    
    rowsOfObject.forEach((r,i)=>{
      const dim = r.get('sessionSourceMedium'),
      rowDataMap = keysMap.has(dim) 
        ? reportData[keysMap.get(dim)]
        : createRowMapByFieldValue_('sessionSourceMedium', dim, keysMap, reportData, )

      rowDataMap.set(period[2], r.get('totalUsers') || 0)
    })   
  }
  
  renderer.render(2, reportData, config)
  const subjectOrFileName = `${config.getPeriod()} ${config.getDomain()} Top ${config.getTopLimit()} ${config.getTrafficMediumCapitalized()} Traffic – Historic – ${Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyy.MM.dd')}`,
    htmlRenderer = new HtmlReportRenderer(sheet, 'template/TmplWeeklyReport.html', renderer.headerMap),
    delivery = new ReportDelivery(config)
  
  //let htmlReport = htmlRenderer.render(rows, ['Last Run On'])
  htmlReport = htmlRenderer.renderFromSheetData(config.hasTotals(), ['Last Run On'])
  delivery.deliverReport(htmlReport, subjectOrFileName)
}

/**
 * Creates a report containing top of traffic sources/mediums for the given domain and period.
 * 
 * @param {Object} configDocId (string) - (Required) ID of the google spreadsheet. You can get it from spreadsheet URL: https://docs.google.com/spreadsheets/d/<sourceSheetID>/.
 * @param {Object} configSheetName (string) - (Required) Name of the sheet containing websites' data/filters etc.
 * @param {Object} domainName (string) - (Required) Just pass top-level domain like "abc.com" without http/https or sub-domains.
 * @param {Object} trafficMedium (string) - (Required) Use values like "organic", "referral" or "total" for organic, referral or total traffic.
 * @param {Object} period (string) - (Required) Use "Weekly", "Monthly", Quarterly, "Semiannual" or "Annual" as value.
 * @param {Object} addTotals (true/false) - (Optional, default is false) Whether to add totals of the columns in the last row or not.
 * @param {Object} sendEmail (true/false) - (Optional, default is false) Whether to send report as email or not. When false, report is saved 
 * as TXT file in html to google drive.
 * @param {Object} emailAddress (string) - Email address where report has to be sent
 */
function reportDomainTopTrafficPeriod(configDocId, configSheetName, domainName, trafficMedium, period, addTotals, sendEmail, emailAddress) {
  const spreadsheetService = new SpreadsheetService()
  const configSheet = spreadsheetService.getSheetByDocIdAndName(configDocId, configSheetName)
  reportDomainTopTrafficPeriod2(configSheet, SpreadsheetApp.getActive(), domainName, trafficMedium, period, addTotals, sendEmail, emailAddress)
}

function createRowMapByFieldValue_(field, value, indexMap, rows)
{
  const rowMap = new Map()
  rowMap.set(field, value)
  indexMap.set(value, rows.length)
  rows.push(rowMap)

  return rowMap
}