class ReportPeriodBuilder {
  constructor(period) {
    this._period = period
  }

  getMonthly(nMonths)
  {
    let f=this.f
    return Array.apply(0, Array(nMonths)).map(function(_,i){
      let monthDate = moment().subtract(i+1, 'months')
      return [f(monthDate.clone().startOf('month')), f(monthDate.endOf('month')), monthDate.format("YYYY-MM")]
    })
  }  

  getQuarterly(nQuarters){
    let f=this.f
    return Array.apply(0, Array(nQuarters)).map(function(_,i){
      let monthDate = moment().subtract(i, 'quarters')
      return [f(monthDate.clone().startOf('quarter')), f(monthDate.endOf('quarter')), monthDate.format("YYYY-[Q]Q")]
    })
  }

  getSemiannually(nHalfs)
  {
    let f=this.f
    // including the current half year
    return Array.apply(0, Array(nHalfs)).map(function(_,i){
      let halfDate = moment().subtract(i*6, 'months')
      let half = halfDate.get('month') < 7  ? 1 : 2,
        month = halfDate.get('month') < 7  ? 0 : 6,
        halfStartDate = moment({year: halfDate.get('year'), month: month, day: 1})
        
      return [f(halfStartDate), f(halfStartDate.add(5, 'months').endOf('month')), `${halfDate.get('year')}-H${half}`]
    })
  }

  getAnnually(nYears)
  { 
    let f=this.f
    return Array.apply(0, Array(nYears)).map(function(_,i){
      let yearDate = moment().subtract(i*12, 'months')
      return [f(yearDate.clone().startOf('year')), f(yearDate.endOf('year')), `${yearDate.get('year')}`]
    })
  }

  f(momentJsDate)
  {
    return momentJsDate.format("YYYY-MM-DD")
  }

  build() {
    let dateRange = [] 
    switch (this._period) {
      case "Weekly":
        dateRange = [
          ['7daysAgo','yesterday', 'Today'], 
          ['14daysAgo', '8daysAgo','1W'], 
          ['36daysAgo', '30daysAgo', '1M'], 
          ['97daysAgo', '91daysAgo', '3M'], 
          ['188daysAgo', '182daysAgo', '6M'], 
          ['370daysAgo', '364daysAgo', '12M']
        ]
        break
      case "Monthly":
        dateRange = this.getMonthly(6)
        break
      case "Quarterly":
        dateRange = this.getQuarterly(4)
        break
      case "Semiannual":
        dateRange = this.getSemiannually(4)
        break
      case "Annual":
        dateRange = this.getAnnually(4)
        break
    }

    return dateRange
  }
}