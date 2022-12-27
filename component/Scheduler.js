class Scheduler
{
  /**
   * This function will delete all sheets EXCEPT Triggers sheet to avoid accidentally deleting users' triggers data.
   */
  setFirstSheetToTriggers() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    spreadsheet.setActiveSheet(spreadsheet.getSheetByName("Triggers"));
    spreadsheet.moveActiveSheet(1);
  }

	/**
	 * This is for installable triggers in documents/spreadsheets etc.
	 */
	getTriggersInfo() {
    var triggers = ScriptApp.getProjectTriggers();
    var counter = 1;
  
    triggers.forEach(function (trigger) {
  
      try {
        //ScriptApp.deleteTrigger(trigger);
        Logger.log("Trigger No. " + counter);
        Logger.log("Unique ID: " + trigger.getUniqueId());
        Logger.log("Handler Function: " + trigger.getHandlerFunction());
        Logger.log("Trigger Source: " + trigger.getTriggerSource());
        //Logger.log("Trigger Source ID: " + trigger.getTriggerSourceId());
        Logger.log("Event Type: " + trigger.getEventType());
  
        counter++;
      }
      catch (e) {
        throw e.message;
      };
    });
  }
  
  isTriggerExists(functionName) {
    var triggers = ScriptApp.getProjectTriggers();
    var counter = 1;
    triggerExists = false;
  
    triggers.forEach(function (trigger) {
  
      try {
  
        if (trigger.getHandlerFunction() == functionName) {
          triggerExists = true;
          return triggerExists;
        }
  
        counter++;
      }
      catch (e) {
        throw e.message;
      };
    });
  
    return triggerExists;
  }
  
  /**
   * Creates new trigger to run a function between specific hours of any weekday.
   * 
   * @param {Object} functionName (string) - (Required) It's the name of the function on which trigger will be applied.
   * @param {Object} weekday (string) - (Required) It's the day of the week on which trigger will be executed. Use days like "Monday", "Tuesday" etc.
   * @param {Object} hour (number) - (Required) It's the hour in which trigger start executing. If 10 is used, trigger will run between 10-11 AM. 
   */
  createMonthdayTrigger(functionName, monthday, hour) {
    ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onMonthDay(monthday).create();
  }
  
  /**
   * Creates new trigger to run a function between specific hours of any weekday.
   * 
   * @param {Object} functionName (string) - (Required) It's the name of the function on which trigger will be applied.
   * @param {Object} weekday (string) - (Required) It's the day of the week on which trigger will be executed. Use days like "Monday", "Tuesday" etc.
   * @param {Object} hour (number) - (Required) It's the hour in which trigger start executing. If 10 is used, trigger will run between 10-11 AM. 
   */
  createWeekdayTrigger(functionName, weekday, hour) {
    switch (weekday) {
      case "Monday":
        ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onWeekDay(ScriptApp.WeekDay.MONDAY).create();
        break;
      case "Tuesday":
        ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onWeekDay(ScriptApp.WeekDay.TUESDAY).create();
        break;
      case "Wednesday":
        ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onWeekDay(ScriptApp.WeekDay.WEDNESDAY).create();
        break;
      case "Thursday":
        ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onWeekDay(ScriptApp.WeekDay.THURSDAY).create();
        break;
      case "Friday":
        ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onWeekDay(ScriptApp.WeekDay.FRIDAY).create();
        break;
      case "Saturday":
        ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onWeekDay(ScriptApp.WeekDay.SATURDAY).create();
        break;
      case "Sunday":
        ScriptApp.newTrigger(functionName).timeBased().atHour(hour).onWeekDay(ScriptApp.WeekDay.SUNDAY).create();
        break;
    }
  }
  
  semiannualReportTrigger() {
    var date = new Date(); // Check today's date

    //If month is January or July then run semiannual report
    if (date.getMonth() == 0 || date.getMonth() == 6) {
    }
  }

  
  /**
   * Deletes all the triggers of the project in which this function runs
   * 
   * @param {Object} interval (number) - (Optional, default value is 500 milliseconds). It's used to avoid "Too many service" error by creating delay after deleting
   * every project trigger.
   */
  deleteTriggers(interval) {

    //interval = 500;

    if (interval == null) {
      interval = 500;
    }

    var triggers = ScriptApp.getProjectTriggers();

    triggers.forEach(function (trigger) {

      try {
        ScriptApp.deleteTrigger(trigger);
      }
      catch (e) {
        throw e.message;
      };

      //Utilities service's sleep method is used to pause the script temporarily for the specified milliseconds to avoid "Too many service" error.
      Utilities.sleep(interval);
    });
  }

  /**
   * This function create triggers automatically from the triggers details from the Triggers sheet.
   * 
   * @param {Object} deleteOldTriggers (boolean) - (Optional, default value is false). Set it to true if you want to delete old filters before creating new ones.
   */
  createTriggersFromSheet(deleteOldTriggers) {

    //If deleteOldTriggers is true then delete all old triggers first
    if (deleteOldTriggers) {
      deleteTriggers();
    }

    var sheetName = "Triggers";
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (sheet != null) {
      var totalTriggers = sheet.getDataRange().getNumRows() - 1;
      var triggersData = sheet.getRange(2, 1, totalTriggers, 5).getValues();

      //Iterate through all triggers data and create triggers accordingly
      for (i = 0; i < totalTriggers; i++) {

        //If monthday is set instead of weekday then set monthday trigger
        if (triggersData[i][2] != "" && triggersData[i][3] == "") {
          if (!isTriggerExists_(triggersData[i][1])) {
            createMonthdayTrigger_(triggersData[i][1], triggersData[i][2], triggersData[i][4]);
          }
        }

        //If weekday is set instead of monthday then set weekday trigger
        if (triggersData[i][2] == "" && triggersData[i][3] != "") {
          if (!isTriggerExists_(triggersData[i][1])) {
            createWeekdayTrigger_(triggersData[i][1], triggersData[i][3], triggersData[i][4]);
          }
        }
      }
    }
  }


  /**
   * This function creates a sheet named as Triggers which users can fill to add information about the triggers they want to add. Later this sheet data is used to 
   * create triggers automatically by using createTriggersFromSheet(deleteOldTriggers) function.
   */
  createTriggersSheet() {

    var headers = ["Report Description", "Function Name", "Monthday", "Weekday", "Hour"];
    var monthdays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
    var weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    var sheetName = "Triggers";
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet == null) {
      //If there is no Triggers sheet then insert it.
      sheet = spreadsheet.insertSheet(sheetName);
      //Add headers to first row
      //sheet.getRange(1,1).setValues(headers);
      sheet.appendRow(headers);
      //Highlight forecasted values
      var range = sheet.getRange(1, 1, 1, sheet.getDataRange().getNumColumns());
      range.setFontWeight("bold");
      range.setBackground("Yellow");
      range.setBorder(true, true, true, true, true, true);

      //Create required data validations
      var monthdaysDataValidation = SpreadsheetApp.newDataValidation().requireValueInList(monthdays).build();
      var weekdaysDataValidation = SpreadsheetApp.newDataValidation().requireValueInList(weekdays).build();
      var hoursDataValidation = SpreadsheetApp.newDataValidation().requireValueInList(hours).build();

      //Add data validations
      for (i = 2; i <= 20; i++) {
        sheet.getRange(i, 3).setDataValidation(monthdaysDataValidation);
        sheet.getRange(i, 4).setDataValidation(weekdaysDataValidation);
        sheet.getRange(i, 5).setDataValidation(hoursDataValidation);
      }

      sheet.autoResizeColumns(1, sheet.getLastColumn());
    }
  }
}