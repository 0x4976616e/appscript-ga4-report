/**
 * A user report configuration
 */
class ReportConfig {
  constructor(configSheet, reportDataSpreadsheet) {
    
    this._trafficMedium = "organic"
    this._emailAddress = null
    this._canSendEmail = false
    this._hasTotals = false
    this.trafficChannels = ['Organic Search', 'Referral', 'Direct', 'Social', '(Other)']
    this._domain = null
    this._reportName = null
    this._reportDataSpreadsheet = null 
    this._dimension = "source"
    this._dimensionLabel = "Source / Medium"
    this._reportPeriod = "Weekly"
    this._configSheet = null
    this._wpCategory = null

    this.setReportDataSpreadsheet(reportDataSpreadsheet)
    this.setConfigSheet(configSheet)
  }

  setReportDataSpreadsheet(reportDataSpreadsheet){
    if(!reportDataSpreadsheet)
    {
      console.info(`Report data spreadsheet in not specified, will use active spreadsheet`)
    }

    this._reportDataSpreadsheet = reportDataSpreadsheet || SpreadsheetApp.getActiveSpreadsheet() // a spreadsheet containing report, configuration spreadsheet is  

    if(!this._reportDataSpreadsheet)
      throw "Report data spreadsheet was not set"
  }

  getReportDataSpreadsheet()
  {    
    return this._reportDataSpreadsheet;
  }

  /**
   * Sets traffic medium.
   * 
   * @return ReportConfig instance
   */
  setTrafficMedium(trafficMedium) {
    
    if(!trafficMedium)
    {
      this._trafficMedium = "organic"
      return this
    }

    let value = trafficMedium.toString().trim().toLowerCase()
    let isValid = value
      && ["organic", "referral", "total"].some(tm => tm == value)

    if(!isValid)
    {
      throw `Invalid traffic medium value. Use one of "organic", "referral" or "total"`
    }

    this._trafficMedium = value
    return this
  }
  /**
   * Traffic medium
   * 
   * "organic", "referral" or "total"
   */
  getTrafficMedium() {
    return this._trafficMedium
  }

  /**
   * Sets email address. The value is not validated!
   *  
   * @return ReportConfig instance
   */
  setEmailAddress(emailAddress) {
    try {
      let value = emailAddress && emailAddress.trim().toLowerCase();
      this._emailAddress = value || null
    }
    catch
    {
      this._emailAddress = null
    }

    return this
  }

  getEmailAddress() {
    return this._emailAddress
  }

  setCanSendEmail(canSendEmail) {
    this._canSendEmail = !!canSendEmail
    return this
  }

  canSendEmail() {
    return this._canSendEmail && !!this.getEmailAddress()
  }

  setHasTotals(hasTotals) {
    this._hasTotals = !!hasTotals
    return this
  }

  hasTotals() {
    return this._hasTotals
  }

  setTrafficChannels(trafficChannels) {
    let value = !!trafficChannels
      && trafficChannels.length > 0
      && trafficChannels.every(ch => !!ch)
      && trafficChannels

    this.trafficChannels = value || ['Organic Search', 'Referral', 'Direct', 'Social', '(Other)']
    return this
  }

  getTrafficChannels() {
    return this.trafficChannels
  }

  setDomain(domain) {
    this._domain = domain
    return this
  }

  getDomain() {
    return this._domain
  }

  /**
   * Create a report name
   * 
   */
  setReportInfo(isWeekly, source, scope) {
    this._reportName = `${scope}-${isWeekly ? "week-" : ""}${source}`
    return this
  }

  getReportInfo() {
    return this._reportName
  }

  getTrafficMediumCapitalized() {
    let tm = this.getTrafficMedium()
    return tm.slice(0, 1).toUpperCase() + tm.slice(1, tm.length)
  }

  setPeriod(period)
  {
    if(!period)
    {
      this._reportPeriod = "Weekly"
      return this
    }

    let value = period.toString().trim().toLowerCase()
    let isValid = value
      && ["weekly", "monthly", "quarterly", "semiannual","annual"].some(tm => tm == value)

    if(!isValid)
    {
      throw `Use one of "Weekly", "Monthly", Quarterly, "Semiannual" or "Annual" as report period value`      
    }

    this._reportPeriod = value.capitalize(value)
    return this
  }

  getPeriod()
  {
    return this._reportPeriod
  }

  setConfigSheet(configSheet)
  {
    if(!configSheet)
      throw "Config sheet is not set"

    this._configSheet = configSheet
    return this
  }

  getGAPropertyId(domainName)
  {
    return this.getSpreadsheetConfig().getGAPropertyId(domainName || this.getDomain())
  }

  getTopLimit(domainName)
  {
    return this.getSpreadsheetConfig().getTopLimit(domainName || this.getDomain())
  }

  getSpreadsheetConfig()
  {
    return new SpreadsheetConfig(this._configSheet)
  }

  setWpCategory(category)
  {
    this._wpCategory = category
    return this
  }
  
  getWpCategory()
  {
    return this._wpCategory
  }

  getConfigSheet()
  {
    return this._configSheet
  }
}

class SpreadsheetConfig
{
  constructor(configSheet)
  {
    this._configSheet = configSheet
  }

  getDomainConfig(domainName)
  {
    const configSheet = this._configSheet,
      sourceRows = configSheet.getDataRange().getNumRows(), //Get total number of rows having data excluding (-1) header row
      websiteFinder = configSheet.getRange(1, 1, sourceRows).createTextFinder(domainName), //Create TextFinder to find row of required website
      websiteCellsRange = websiteFinder.findNext()  // Returns Range matching with searched website otherwise null
    
    if(!websiteCellsRange)
      throw `'${domainName}' domain configuration is not found on spreadsheet sheet '${configSheet.getName()}'`
       
    //Return the row containing all filters related to a website like aspose.com
    const configRowRange = configSheet.getRange(websiteCellsRange.getRow(), 2, 1, configSheet.getDataRange().getLastColumn()), 
    domainConfigRow = configRowRange.getValues()
   
    return domainConfigRow[0] // 1st row of 2 dim array
  }

  /** 
   * Gets Google Analytics 4 propety Id
   * 
   * @param {domainName} website config name
   */
  getGAPropertyId(domainName)
  {
    if(!domainName)
      throw 'Invalid domain name'

    return this.getDomainConfig(domainName)[0]
  }

  getTopLimit(domainName)
  {
    if(!domainName)
      throw 'Invalid domain name'
    
    return this.getDomainConfig(domainName)[1]
  }
}

