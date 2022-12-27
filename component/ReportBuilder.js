class ReportBuilder
{
  constructor(reportConfig){
    this._config = reportConfig
  }

  createReportSheet(sheetName) {
    
    //Delete old report before creating new one
    let sheet = this._reportSpreadSheet.getSheetByName(sheetName)
    if (sheet) {
      this._reportSpreadSheet.deleteSheet(sheet)
    }
  
    //Insert new empty sheet to store new stats
    this._reportSheet = this._reportSpreadSheet.insertSheet(sheetName)
    return this._reportSheet 
  }
}
