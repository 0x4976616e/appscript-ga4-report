function testDeleteSheets_()
{
  const service = new SpreadsheetService(),
	testSpreadsheet = service.openOrCreateSpreadsheetFile("SpreadsheetServiceTest")

	service.getOrCreateSheet(testSpreadsheet, "TestSheet1")
  service.getOrCreateSheet(testSpreadsheet, "TestSheet2")

	service.deleteSheetsByFilter(testSpreadsheet, (s,n)=> n.endsWith("Sheet1"))

	testSpreadsheet.getSheets().length > 1 
		? console.error("was not removed")
		: console.info("test pass") 
}