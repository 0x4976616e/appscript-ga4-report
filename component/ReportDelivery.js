class ReportDelivery {
  constructor(config) {
    this.delivery = new Delivery()
    this.config = config
  }

  deliverReport(htmlReport, subjectOrFileName) {
    this.deliver(this.config.canSendEmail(), htmlReport, this.config.getEmailAddress(), subjectOrFileName)
  }

  deliver(sendEmail, htmlReport, emailAddress, subjectOrFileName) {
    LogVerbose && console.info(`Deliver report ${sendEmail} ${htmlReport} ${emailAddress} ${subjectOrFileName}`)
    if (sendEmail) {
      if(!this.config.getWpCategory())
        throw "WordPress blog category was not set"

      let body = `[category ${this.config.getWpCategory()}] ${htmlReport}`
      this.delivery.sendEmail(emailAddress, subjectOrFileName, body)
    }
    else {
      console.info(`Save report ${subjectOrFileName} to Google Drive root`)
      this.delivery.saveAsFile(subjectOrFileName, htmlReport)
    }
  }
}

class Delivery {
  /**
   * Sends an email to the specified address
   */
  sendEmail(address, subject, body) {
    console.info(`Send email '${subject}' to ${address}`)
    MailApp.sendEmail({
      to: address,
      subject: subject,
      htmlBody: body
    })
  }

  /**
   * Saves email to google drive storage
   */
  saveAsFile(fileName, content, fileExtension = 'html') {
    DriveApp.createFile(`${fileName}.${fileExtension}`, content);
  }
}
