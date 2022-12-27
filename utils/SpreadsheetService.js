class SpreadsheetService
{
  openOrCreateSpreadsheetFile(fileName){
    var files = DriveApp.searchFiles(`title='${fileName}'`)
    return files.hasNext() ? SpreadsheetApp.open(files.next()) : SpreadsheetApp.create(fileName)
  }

  recreateReportSheet(spreadsheet, sheetName) {
    if(!spreadsheet)
      throw "Spreadsheet document is not specified"

    if(!sheetName) 
      throw "Sheet name is not specified"

    //Delete old one before creating new one
    let sheet = spreadsheet.getSheetByName(sheetName)
    if (sheet) {
      spreadsheet.deleteSheet(sheet)
    }
  
    //Insert new empty sheet to store new stats
    sheet = spreadsheet.insertSheet(sheetName)
    return sheet 
  }

  getSheetByDocIdAndName(spreadsheetId, sheetName)
  {
    if(!spreadsheetId)
      throw "Spreadsheet id is not specified"

    if(!sheetName) 
      throw "Sheet name is not specified"

    const document = SpreadsheetApp.openById(spreadsheetId)
    if(!document)
      throw `Spreadsheet document id=${spreadsheetId} was not found`

    const sheet = document.getSheetByName(sheetName)
    if(!sheet)
      throw `Sheet '${sheetName}' was not found in spreadsheet document id=${spreadsheetId}`

    return sheet
  }

  getOrCreateSheet(spreadsheet, sheetName)
  {
    if(!spreadsheet)
      throw "Spreadsheet is not specified"

    if(!sheetName) 
      throw "Sheet name is not specified"

    let sheet = spreadsheet.getSheetByName(sheetName)
    return sheet || spreadsheet.insertSheet(sheetName)
  }

  getOrCreateSheetByDocId(docId, sheetName)
  {
    if(!docId)
      throw "Spreadsheet id is not specified"

    const document = SpreadsheetApp.openById(docId)
    return this.getOrCreateSheet(document, sheetName)
  }

	/**
	 * Deletes all filtered sheets
	 * 
	 * @param {*} filterSheet - filter expression that accepts sheet and sheet name as arguments: filter(sheet, sheetName)  
	 */
	deleteSheetsByFilter(spreadsheet, filterSheet) {
		if(!spreadsheet )
		{
			console.error("Spreadsheet is not set")
			return
		}

		let sheets = spreadsheet.getSheets()
		
		const removeSheets = !!filterSheet 
			? sheets.filter(sheet=>filterSheet(sheet, sheet.getName()) === true) 
			: sheets
		
		removeSheets.forEach(sheet => {
			spreadsheet.deleteSheet(sheet);
		});	
  }

  /**
   * Adds a link to the specified sheet 
   * 
   * @param {Range} targetCell - where the link is inserted
   * @param {Sheet} sheet - a sheet the link references
   * @param {String} linkLabel - an optional the link's label
   */
  addLinkToSheet(targetCell, linkLabel, sheet)
  {
    if(!targetCell || !sheet)
      return

    targetCell.setValue(`=hyperlink("#gid=${sheet.getSheetId()}","${linkLabel || sheet.getSheetName()}")`)
  }

  /**
   * Adds a link to the specified sheet of another document
   * 
   * @param {Range} targetCell - where the link is inserted
   * @param {Sheet} sheet - a sheet the link references
   * @param {String} linkLabel - an optional the link's label
   */
  addLinkToDocumentSheet(targetCell, linkLabel, sheet)
  {
    if(!targetCell || !sheet)
      return

    const reference = `https://docs.google.com/spreadsheets/d/${sheet.getParent().getId()}/#gid=${sheet.getSheetId()}`
    targetCell.setValue(`=hyperlink("${reference}","${linkLabel || sheet.getSheetName()}")`)
  }  
}